const DEFAULT_MODEL = 'openrouter/free';

const ALLOWED_MODELS = new Set([
  DEFAULT_MODEL,
  'cohere/north-mini-code:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
]);

async function supabaseFetch(path, accessToken, options = {}) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || data?.error_description || data?.error || 'Supabase request failed.';
    throw new Error(message);
  }

  return data;
}

async function getUser(accessToken) {
  return supabaseFetch('/auth/v1/user', accessToken, {
    method: 'GET',
    headers: { Prefer: undefined },
  });
}

async function saveMessage({ accessToken, conversationId, userId, role, content, model }) {
  const payload = {
    conversation_id: conversationId,
    user_id: userId,
    role,
    content,
    model: model || null,
  };

  const rows = await supabaseFetch('/rest/v1/messages', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return rows?.[0];
}

async function touchConversation({ accessToken, conversationId }) {
  await supabaseFetch(`/rest/v1/conversations?id=eq.${conversationId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ updated_at: new Date().toISOString() }),
    headers: { Prefer: 'return=minimal' },
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured.' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    return res.status(500).json({ error: 'Supabase environment variables are not configured.' });
  }

  const accessToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!accessToken) {
    return res.status(401).json({ error: 'Missing Supabase access token.' });
  }

  const { message, model, conversationId } = req.body || {};
  const selectedModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ error: 'Conversation ID is required.' });
  }

  try {
    const user = await getUser(accessToken);
    const prompt = message.slice(0, 4000);

    const userMessage = await saveMessage({
      accessToken,
      conversationId,
      userId: user.id,
      role: 'user',
      content: prompt,
      model: selectedModel,
    });

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://hello-world.vercel.app',
        'X-Title': 'Hello World Auth Chat',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are a concise, helpful chatbot inside a small demo app.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const data = await openRouterResponse.json();

    if (!openRouterResponse.ok) {
      return res.status(openRouterResponse.status).json({
        error: data?.error?.message || data?.error || 'OpenRouter request failed.',
      });
    }

    const assistantText = data?.choices?.[0]?.message?.content || '';
    const assistantMessage = await saveMessage({
      accessToken,
      conversationId,
      userId: user.id,
      role: 'assistant',
      content: assistantText,
      model: selectedModel,
    });

    await touchConversation({ accessToken, conversationId });

    return res.status(200).json({
      model: selectedModel,
      text: assistantText,
      messages: [userMessage, assistantMessage].filter(Boolean),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected server error.' });
  }
};

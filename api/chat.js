const ALLOWED_MODELS = new Set([
  'cohere/north-mini-code:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
]);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured.' });
  }

  const { message, model } = req.body || {};
  const selectedModel = ALLOWED_MODELS.has(model) ? model : 'cohere/north-mini-code:free';

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
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
            content: message.slice(0, 4000),
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

    return res.status(200).json({
      model: selectedModel,
      text: data?.choices?.[0]?.message?.content || '',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected server error.' });
  }
};

(() => {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatSubmit = document.getElementById('chat-submit');
  const chatStatus = document.getElementById('chat-status');
  const chatLog = document.getElementById('chat-log');
  const modelSelect = document.getElementById('model-select');
  const newConversationButton = document.getElementById('new-conversation-button');
  const deleteConversationButton = document.getElementById('delete-conversation-button');
  const conversationSearch = document.getElementById('conversation-search');
  const conversationList = document.getElementById('conversation-list');

  if (!chatForm || !newConversationButton || !conversationList) {
    return;
  }

  const cleanChatForm = chatForm.cloneNode(true);
  chatForm.replaceWith(cleanChatForm);

  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const submit = document.getElementById('chat-submit');

  let currentUser = null;
  let currentConversationId = null;
  let conversations = [];
  let searchTimeout = null;
  let editingConversationId = null;

  function getClient() {
    const { url, publishableKey } = window.SUPABASE_CONFIG || {};
    if (!url || !publishableKey) {
      return null;
    }
    window.__historySupabaseClient ||= window.supabase.createClient(url, publishableKey);
    return window.__historySupabaseClient;
  }

  function setStatus(text, type = 'info') {
    chatStatus.textContent = text;
    chatStatus.dataset.type = type;
  }

  function appendMessage(role, text) {
    const item = document.createElement('article');
    item.className = `chat-message ${role === 'assistant' ? 'bot' : role}`;

    const label = document.createElement('strong');
    label.textContent = role === 'user' ? 'You' : 'Model';

    const body = document.createElement('p');
    body.textContent = text;

    item.append(label, body);
    chatLog.append(item);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function renderMessages(messages) {
    chatLog.innerHTML = '';
    for (const row of messages) {
      appendMessage(row.role, row.content);
    }
  }

  async function renameConversation(conversationId, title) {
    const client = getClient();
    const cleanTitle = title.trim().slice(0, 80);

    if (!client || !conversationId || !cleanTitle) {
      return;
    }

    const { error } = await client
      .from('conversations')
      .update({ title: cleanTitle, updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      throw error;
    }

    editingConversationId = null;
    await loadConversations({ keepCurrent: true, skipLoadMessages: true });
    setStatus('Conversation renamed.', 'success');
  }

  function renderConversationReadMode(conversation, item) {
    const title = document.createElement('strong');
    title.textContent = conversation.title;

    const time = document.createElement('span');
    time.textContent = new Date(conversation.updated_at).toLocaleString();

    const actions = document.createElement('div');
    actions.className = 'conversation-actions';

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'conversation-open-button';
    openButton.textContent = 'Open';
    openButton.addEventListener('click', () => loadConversation(conversation.id));

    const renameButton = document.createElement('button');
    renameButton.type = 'button';
    renameButton.className = 'conversation-rename-button';
    renameButton.textContent = 'Rename';
    renameButton.addEventListener('click', () => {
      editingConversationId = conversation.id;
      renderConversations();
    });

    actions.append(openButton, renameButton);
    item.append(title, time, actions);
  }

  function renderConversationEditMode(conversation, item) {
    const form = document.createElement('form');
    form.className = 'conversation-edit-form';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = conversation.title;
    input.maxLength = 80;
    input.required = true;
    input.setAttribute('aria-label', 'Conversation title');

    const actions = document.createElement('div');
    actions.className = 'conversation-actions';

    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.textContent = 'Save';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'conversation-rename-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
      editingConversationId = null;
      renderConversations();
    });

    actions.append(saveButton, cancelButton);
    form.append(input, actions);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      saveButton.disabled = true;

      try {
        await renameConversation(conversation.id, input.value);
      } catch (error) {
        setStatus(error.message, 'error');
      } finally {
        saveButton.disabled = false;
      }
    });

    item.append(form);
    window.setTimeout(() => input.focus(), 0);
  }

  function renderConversations() {
    conversationList.innerHTML = '';

    if (conversations.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'history-empty';
      empty.textContent = conversationSearch.value.trim()
        ? 'No conversations matched your search.'
        : 'No conversations yet.';
      conversationList.append(empty);
      return;
    }

    for (const conversation of conversations) {
      const item = document.createElement('article');
      item.className = 'conversation-item';
      item.classList.toggle('active', conversation.id === currentConversationId);

      if (conversation.id === editingConversationId) {
        renderConversationEditMode(conversation, item);
      } else {
        renderConversationReadMode(conversation, item);
      }

      conversationList.append(item);
    }
  }

  async function createConversation(title = 'New conversation') {
    const client = getClient();
    if (!client || !currentUser) return null;

    const { data, error } = await client
      .from('conversations')
      .insert({ user_id: currentUser.id, title })
      .select()
      .single();

    if (error) throw error;

    currentConversationId = data.id;
    await loadConversations({ keepCurrent: true, skipLoadMessages: true });
    await loadConversation(data.id);
    return data;
  }

  async function loadConversation(conversationId) {
    const client = getClient();
    if (!client || !conversationId) return;

    currentConversationId = conversationId;
    renderConversations();
    setStatus('Loading conversation...');

    const { data, error } = await client
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      setStatus(error.message, 'error');
      return;
    }

    renderMessages(data || []);
    setStatus('');
  }

  async function loadConversations(options = {}) {
    const client = getClient();
    if (!client || !currentUser) return;

    const searchTerm = conversationSearch.value.trim();
    let rows = [];
    let error = null;

    if (searchTerm) {
      const titleMatches = await client
        .from('conversations')
        .select('*')
        .eq('user_id', currentUser.id)
        .ilike('title', `%${searchTerm}%`)
        .limit(25);

      const messageMatches = await client
        .from('messages')
        .select('conversation_id')
        .eq('user_id', currentUser.id)
        .ilike('content', `%${searchTerm}%`)
        .limit(50);

      error = titleMatches.error || messageMatches.error;

      const ids = new Set((titleMatches.data || []).map((row) => row.id));
      for (const row of messageMatches.data || []) ids.add(row.conversation_id);

      if (!error && ids.size > 0) {
        const result = await client
          .from('conversations')
          .select('*')
          .eq('user_id', currentUser.id)
          .in('id', [...ids])
          .order('updated_at', { ascending: false });
        rows = result.data || [];
        error = result.error;
      }
    } else {
      const result = await client
        .from('conversations')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false })
        .limit(25);
      rows = result.data || [];
      error = result.error;
    }

    if (error) {
      setStatus(error.message, 'error');
      return;
    }

    conversations = rows;

    if (!options.keepCurrent && conversations.length > 0 && !currentConversationId) {
      currentConversationId = conversations[0].id;
    }

    renderConversations();

    if (!searchTerm && conversations.length === 0) {
      await createConversation();
      return;
    }

    if (currentConversationId && !options.skipLoadMessages) {
      await loadConversation(currentConversationId);
    }
  }

  async function initializeHistory() {
    const client = getClient();
    if (!client) return;

    const { data } = await client.auth.getSession();
    currentUser = data.session?.user || null;

    if (currentUser) {
      await loadConversations();
    }
  }

  newConversationButton.addEventListener('click', async () => {
    try {
      await createConversation();
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });

  deleteConversationButton.addEventListener('click', async () => {
    const client = getClient();
    if (!client || !currentConversationId) return;

    if (!window.confirm('Delete this conversation and all of its messages?')) return;

    const { error } = await client
      .from('conversations')
      .delete()
      .eq('id', currentConversationId);

    if (error) {
      setStatus(error.message, 'error');
      return;
    }

    currentConversationId = null;
    chatLog.innerHTML = '';
    await loadConversations();
  });

  conversationSearch.addEventListener('input', () => {
    window.clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => {
      currentConversationId = null;
      loadConversations({ skipLoadMessages: true });
    }, 250);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const client = getClient();
    const prompt = input.value.trim();
    const model = modelSelect.value;

    if (!client || !prompt) return;

    try {
      const { data } = await client.auth.getSession();
      const session = data.session;
      currentUser = session?.user || null;

      if (!session?.access_token || !currentUser) {
        throw new Error('Log in again before sending a message.');
      }

      if (!currentConversationId) {
        await createConversation(prompt.slice(0, 60));
      }

      appendMessage('user', prompt);
      input.value = '';
      submit.disabled = true;
      setStatus('Thinking...');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: prompt, model, conversationId: currentConversationId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'The model request failed.');
      }

      appendMessage('assistant', result.text || '(No response text returned.)');
      await loadConversations({ keepCurrent: true, skipLoadMessages: true });
      setStatus('');
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      submit.disabled = false;
      input.focus();
    }
  });

  const client = getClient();
  if (client) {
    client.auth.onAuthStateChange(async (_event, session) => {
      currentUser = session?.user || null;
      currentConversationId = null;
      conversations = [];
      editingConversationId = null;
      chatLog.innerHTML = '';
      conversationList.innerHTML = '';

      if (currentUser) {
        await loadConversations();
      }
    });
  }

  initializeHistory();
})();

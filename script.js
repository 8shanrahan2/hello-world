const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');
const authForm = document.getElementById('auth-form');
const authMessage = document.getElementById('auth-message');
const authSubmit = document.getElementById('auth-submit');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const helloButton = document.getElementById('hello-button');
const logoutButton = document.getElementById('logout-button');
const message = document.getElementById('message');
const userSummary = document.getElementById('user-summary');

let authMode = 'login';
let supabaseClient = null;

function getSupabaseConfig() {
  return window.SUPABASE_CONFIG ?? {};
}

function hasValidSupabaseConfig() {
  const { url, publishableKey } = getSupabaseConfig();
  return Boolean(
    url &&
      publishableKey &&
      publishableKey !== 'PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE'
  );
}

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!hasValidSupabaseConfig()) {
    return null;
  }

  const { url, publishableKey } = getSupabaseConfig();
  supabaseClient = window.supabase.createClient(url, publishableKey);
  return supabaseClient;
}

function setAuthMode(mode) {
  authMode = mode;
  const isLogin = mode === 'login';

  loginTab.classList.toggle('active', isLogin);
  signupTab.classList.toggle('active', !isLogin);
  loginTab.setAttribute('aria-selected', String(isLogin));
  signupTab.setAttribute('aria-selected', String(!isLogin));
  authSubmit.textContent = isLogin ? 'Log in' : 'Create account';
  authMessage.textContent = '';
}

function showApp(user) {
  authView.classList.add('hidden');
  appView.classList.remove('hidden');
  authMessage.textContent = '';
  userSummary.textContent = `You are signed in as ${user.email}.`;
}

function showAuth() {
  appView.classList.add('hidden');
  authView.classList.remove('hidden');
  message.textContent = '';
}

function setAuthMessage(text, type = 'info') {
  authMessage.textContent = text;
  authMessage.dataset.type = type;
}

async function refreshSession() {
  const client = getSupabaseClient();

  if (!client) {
    showAuth();
    setAuthMessage('Add your Supabase publishable key in config.js to enable real auth.', 'error');
    return;
  }

  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error) {
    showAuth();
    setAuthMessage(error.message, 'error');
    return;
  }

  if (session?.user) {
    showApp(session.user);
    return;
  }

  showAuth();
}

loginTab.addEventListener('click', () => setAuthMode('login'));
signupTab.addEventListener('click', () => setAuthMode('signup'));

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const client = getSupabaseClient();

  if (!client) {
    setAuthMessage('Add your Supabase publishable key in config.js to enable real auth.', 'error');
    return;
  }

  const formData = new FormData(authForm);
  const email = String(formData.get('email')).trim().toLowerCase();
  const password = String(formData.get('password'));

  authSubmit.disabled = true;
  setAuthMessage(authMode === 'login' ? 'Logging in…' : 'Creating account…');

  const { data, error } =
    authMode === 'login'
      ? await client.auth.signInWithPassword({ email, password })
      : await client.auth.signUp({ email, password });

  authSubmit.disabled = false;

  if (error) {
    setAuthMessage(error.message, 'error');
    return;
  }

  authForm.reset();

  if (data.session?.user) {
    showApp(data.session.user);
    return;
  }

  if (authMode === 'signup') {
    setAuthMessage('Account created. Check your email to confirm your account, then log in.', 'success');
    setAuthMode('login');
    return;
  }

  await refreshSession();
});

helloButton.addEventListener('click', () => {
  message.textContent = 'Hello from JavaScript!';
});

logoutButton.addEventListener('click', async () => {
  const client = getSupabaseClient();

  if (client) {
    await client.auth.signOut();
  }

  showAuth();
});

const client = getSupabaseClient();

if (client) {
  client.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      showApp(session.user);
    } else {
      showAuth();
    }
  });
}

setAuthMode('login');
refreshSession();

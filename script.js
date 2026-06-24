const DEMO_USER = {
  email: 'demo@example.com',
  password: 'password123',
};

const AUTH_STORAGE_KEY = 'hello-world-authenticated';

const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const helloButton = document.getElementById('hello-button');
const logoutButton = document.getElementById('logout-button');
const message = document.getElementById('message');

function showApp() {
  loginView.classList.add('hidden');
  appView.classList.remove('hidden');
  loginMessage.textContent = '';
}

function showLogin() {
  appView.classList.add('hidden');
  loginView.classList.remove('hidden');
  message.textContent = '';
}

function isAuthenticated() {
  return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
}

function setAuthenticated(value) {
  if (value) {
    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    showApp();
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
  showLogin();
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const email = String(formData.get('email')).trim().toLowerCase();
  const password = String(formData.get('password'));

  if (email === DEMO_USER.email && password === DEMO_USER.password) {
    loginForm.reset();
    setAuthenticated(true);
    return;
  }

  loginMessage.textContent = 'Invalid email or password. Try the demo login above.';
});

helloButton.addEventListener('click', () => {
  message.textContent = 'Hello from JavaScript!';
});

logoutButton.addEventListener('click', () => {
  setAuthenticated(false);
});

if (isAuthenticated()) {
  showApp();
} else {
  showLogin();
}

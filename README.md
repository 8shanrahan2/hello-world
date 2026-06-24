# Hello World

A minimal web application built with HTML, CSS, JavaScript, and Supabase Auth.

## Run Locally

Open `index.html` in a browser.

## Supabase Auth setup

This app expects a Supabase project URL and publishable key in `config.js`.

1. Open your Supabase project.
2. Go to **Project Settings → API**.
3. Copy your project URL and publishable key.
4. Update `config.js`:

```js
window.SUPABASE_CONFIG = {
  url: 'https://your-project-ref.supabase.co',
  publishableKey: 'your-supabase-publishable-key',
};
```

For this project, the Supabase URL is already set to:

```txt
https://krbandlgishkmnxylkhq.supabase.co
```

You still need to paste in the publishable key.

## Features

- Create account with email and password
- Log in with email and password
- Persist session with Supabase Auth
- Log out
- Hello World page after authentication
- No build tools required

## Notes

This is a client-only static demo. It is good for learning the browser auth flow. For a production app with server-rendered protected routes, convert this to a framework like Next.js and use Supabase server-side auth helpers.

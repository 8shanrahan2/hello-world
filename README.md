# Hello World

A minimal web application built with HTML, CSS, JavaScript, Supabase Auth, and an OpenRouter chat wrapper.

## Run Locally

Set the required environment variables, then run the build script:

```bash
export SUPABASE_URL="https://kutisicwxqynceyeqltx.supabase.co"
export SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
export OPENROUTER_API_KEY="your-openrouter-api-key"
npm run build
```

Open `dist/index.html` in a browser.

For local API testing, run the app through Vercel instead of opening the file directly:

```bash
vercel dev
```

## Supabase Auth setup

This app generates `dist/config.js` at build time from environment variables.

Required variables:

```txt
SUPABASE_URL=https://kutisicwxqynceyeqltx.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

In Vercel, add both variables under:

**Project Settings → Environment Variables**

Add them for **Preview** and **Production** if you want both environments to work.

The publishable key is safe to expose in browser code. The deployed site still serves it to the browser because Supabase client-side auth needs it. Keeping it in Vercel env vars prevents committing the value to GitHub, but it does not make the publishable key secret.

Do not expose a Supabase service-role key in frontend code.

If email confirmations are enabled in Supabase, newly created users must confirm their email before logging in.

## OpenRouter setup

Add this Vercel environment variable for Preview and Production:

```txt
OPENROUTER_API_KEY=your-openrouter-api-key
```

The OpenRouter key is a real secret. It is only used by the server-side `/api/chat` function and should never be exposed in browser JavaScript.

The app currently hard-codes a small allowlist of free OpenRouter models in both the UI and `/api/chat`, so the browser cannot choose arbitrary paid models through your API key.

## Features

- Create account with email and password
- Log in with email and password
- Persist session with Supabase Auth
- Log out
- Hello World page after authentication
- Authenticated chat UI backed by OpenRouter
- Server-side OpenRouter API wrapper
- Build-time config generation from Vercel environment variables

## Notes

This is a client-only static demo with a small Vercel API route for model calls. It is good for learning auth, environment variables, and model-provider wrappers. For a production app with private data, add Supabase Row Level Security policies and move privileged logic server-side.

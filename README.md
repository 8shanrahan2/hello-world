# Hello World

A minimal web application built with HTML, CSS, JavaScript, and Supabase Auth.

## Run Locally

Set the required environment variables, then run the build script:

```bash
export SUPABASE_URL="https://kutisicwxqynceyeqltx.supabase.co"
export SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
npm run build
```

Open `dist/index.html` in a browser.

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

## Features

- Create account with email and password
- Log in with email and password
- Persist session with Supabase Auth
- Log out
- Hello World page after authentication
- Build-time config generation from Vercel environment variables

## Notes

This is a client-only static demo. It is good for learning the browser auth flow. For a production app with server-rendered protected routes, convert this to a framework like Next.js and use Supabase server-side auth helpers.

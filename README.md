# Hello World

A minimal web application built with HTML, CSS, JavaScript, and Supabase Auth.

## Run Locally

Open `index.html` in a browser.

## Supabase Auth setup

This app uses Supabase Auth through `config.js`.

```js
window.SUPABASE_CONFIG = {
  url: 'https://kutisicwxqynceyeqltx.supabase.co',
  publishableKey: 'sb_publishable_pwQ_P77r2OeIZJdQLgSZ3w_SPWTaMAO',
};
```

The publishable key is safe to expose in browser code. Do not expose a Supabase service-role key in frontend code.

If email confirmations are enabled in Supabase, newly created users must confirm their email before logging in.

## Features

- Create account with email and password
- Log in with email and password
- Persist session with Supabase Auth
- Log out
- Hello World page after authentication
- No build tools required

## Notes

This is a client-only static demo. It is good for learning the browser auth flow. For a production app with server-rendered protected routes, convert this to a framework like Next.js and use Supabase server-side auth helpers.

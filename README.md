# IT Food Web App

Responsive web app for IT Food customers and restaurant admins.

## Deploying to Vercel

Set the project root to this folder, `apps/web-desktop`, then use:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Add these environment variables in Vercel before production deploy:

- `VITE_SUPABASE_URL=https://yczzrgowkbaolkcmudvx.supabase.co`
- `VITE_SUPABASE_ANON_KEY`

Important: `VITE_SUPABASE_URL` must be the Supabase project URL, not the Vercel deployment URL. If it is set to a Vercel domain, Google login will incorrectly open a URL like `/auth/v1/authorize` on the Vercel app.

The app includes a fallback to the known Supabase project URL so a mistaken Vercel env value does not blank the app, but Vercel should still be corrected and redeployed.

In Supabase Auth URL Configuration, set:

- Site URL: `https://www.itfood.in`
- Redirect URLs: `https://www.itfood.in/**`
- Local dev redirect URL: `http://127.0.0.1:5173/**`

If Google login redirects back with `Database error saving new user`, run
`supabase/fix-google-oauth-new-user.sql` in Supabase SQL Editor. That error is
caused by a failing database trigger on `auth.users`, not by Vercel routing.

The app is configured for the production domain `https://www.itfood.in/`. Add both `itfood.in` and `www.itfood.in` to the Vercel project, then point GoDaddy DNS to Vercel. The apex domain redirects permanently to `www.itfood.in`.

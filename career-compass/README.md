# MargDarshak-AI

MargDarshak-AI is a React career-guidance app backed by an Express API and Gemini. Signed-in users can save their assessment, career analysis, learning progress, and private feedback to PostgreSQL.

Career assessments return five recommendations by default. In the customization step, users can request up to ten; the backend schema and result cards use the selected count.

## Requirements

- Node.js 20 or newer
- A Gemini API key
- A hosted PostgreSQL database for account and saved-data features
- A Google OAuth web client ID to enable Google sign-in (optional; email/password sign-in works without it)

## Configure the app

In PowerShell, from the project directory:

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
```

Set the following values in `backend\.env`:

- `GEMINI_API_KEY`: your server-side Gemini API key.
- `DATABASE_URL`: the connection string provided by your PostgreSQL host. Use the provider's SSL-enabled connection string for hosted databases.
- `GOOGLE_CLIENT_ID`: your Google OAuth web client ID. This can be left unset to disable Google sign-in.
- `APP_ORIGINS`: comma-separated frontend origins allowed to make state-changing API requests.
- `SESSION_COOKIE_SECURE`: set to `true` when the app is served over HTTPS.

Set `VITE_GOOGLE_CLIENT_ID` in the frontend `.env` to the same OAuth web client ID. This is a public client identifier, not a secret. The backend independently verifies Google credentials. Never put the Gemini key or the database URL in the frontend environment.

The backend initializes the database tables when it starts. Keep both `.env` files out of source control; only the `.env.example` templates belong in the repository.

## Run locally

Open two PowerShell terminals in `career-compass`.

Terminal 1 — backend:

```powershell
Set-Location backend
npm install
npm run dev
```

Terminal 2 — frontend:

```powershell
npm install
npm run dev
```

Vite serves the frontend on `http://localhost:5173` and proxies `/api` requests to the backend on port `3001`.

## Verify

```powershell
Set-Location backend
npm test
Set-Location ..
npm run lint
npm run build
```

## Project structure

- `src/App.jsx` — page navigation, assessment flow, session restoration, and analysis display.
- `src/components/AccountPages.jsx` — sign-up/sign-in, Google sign-in, progress tracking, feedback, and public landing-page sections.
- `src/components/CareerResultsDashboard.jsx` — dynamically rendered career recommendations, skill gaps, roadmap, and projects.
- `backend/src/app.js` — JSON API routes, validation, authentication, and safe error responses.
- `backend/src/auth.js` — password hashing, private session cookies, and Google token verification.
- `backend/src/database.js` — PostgreSQL schema and account-scoped data access.
- `backend/src/services/geminiCareerAnalysis.js` — server-side Gemini analysis.

The API stores passwords only as scrypt hashes and stores session-token hashes rather than raw session tokens. The browser receives an HttpOnly session cookie; account names, email addresses, password hashes, assessment answers, and feedback are not returned by the account endpoints. Assessment analysis is returned to the authenticated browser because the dashboard needs it to render results.

For production, serve the frontend and API on the same site or configure a reverse proxy so `/api` reaches the backend. Set the production frontend origin in `APP_ORIGINS` and enable `SESSION_COOKIE_SECURE`.

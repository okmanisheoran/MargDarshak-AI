# MargDarshak-AI

**Personalized, practical career guidance for students in India.**

MargDarshak-AI turns a student's interests, strengths, education context, and preferences into a structured career exploration plan. It combines a responsive React app with a Node.js/Express API, Google's Gemini models, and PostgreSQL-backed accounts and progress.

> Career suggestions are starting points for exploration, not guarantees of admission, employment, income, or career success.

## What it does

- Guides students through a career assessment with optional Indian education/career context and personal instructions.
- Generates **five career options by default**, with a choice of **five to ten**.
- Explains why each career may fit, the skills it uses, potential skill gaps, and practical first steps.
- Produces a six-month learning roadmap and beginner-friendly project ideas.
- Provides account sign-up/sign-in, Google sign-in when configured, saved assessments, learning progress, and feedback.
- Lets users switch accounts or sign out; account data is scoped to the signed-in user.
- Adapts the dashboard to the returned analysis instead of hardcoding career recommendations.

## Technology

| Area | Components |
| --- | --- |
| Frontend | React 19, JavaScript ES modules, Vite 8, custom responsive CSS |
| Backend | Node.js 20+, Express 5, JSON REST API |
| Generative AI | Google's official `@google/genai` JavaScript SDK |
| Authentication | Scrypt password hashing, HttpOnly session cookies, Google ID-token verification with `google-auth-library` |
| Data | PostgreSQL with `pg`; database tables are initialized by the backend |
| Configuration | `dotenv`; browser-exposed settings use the `VITE_` prefix, server secrets do not |
| Hosting | Vercel for the static frontend and Express serverless function |

No separate UI component library or client-side router is used; the interface and page navigation are implemented in the project components and CSS.

## Project layout

```text
.
├── api/
│   └── index.js                     Vercel function entry point for the Express API
├── career-compass/
│   ├── index.html                    Frontend HTML entry
│   ├── src/
│   │   ├── App.jsx                   Main app, assessment flow, navigation, account menu
│   │   ├── App.css                   Main interface styles
│   │   ├── index.css                 Global styles and typography
│   │   └── components/
│   │       ├── AccountPages.jsx      Sign-in/up, landing sections, progress, feedback
│   │       └── CareerResultsDashboard.jsx Results, skills, roadmap, beginner projects
│   └── backend/
│       ├── src/                      Express API, auth, database, AI, validation
│       ├── test/api.test.js
│       ├── .env.example
│       └── AI_CAREER_ANALYSIS.md
├── public/                           Static public assets
├── .env.example                      Frontend environment template
├── package.json                      Frontend scripts and dependencies
├── vercel.json                       Vercel install command and API routing
└── vite.config.js                    Local Vite server and API proxy
```

### Request flow

1. The React assessment sends JSON to `POST /api/analyze-career`.
2. Express validates the assessment and requires an authenticated user.
3. The backend sends the answers and selected career count to Gemini using the server-only API key.
4. The backend validates the generated structure, saves the assessment to PostgreSQL, and returns it to the browser.
5. React renders the career cards, skills and gaps, six-month roadmap, and projects from that response.

The Vercel function in `api/index.js` adapts the Express app for serverless requests. Locally, Vite proxies `/api` to the Express development server.

## Requirements

- Node.js 20 or newer and npm.
- A Gemini API key for career analysis.
- A hosted PostgreSQL database for account and saved-data features.
- A Google OAuth web client ID for Google sign-in (optional; email/password sign-in can be used without it).

## Run locally

From the repository root, open two terminals.

### 1. Configure environment files

PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item career-compass\backend\.env.example career-compass\backend\.env
```

Set the following values:

**`career-compass/backend/.env`**

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes for AI analysis | Private Gemini API key. Keep it on the server. |
| `DATABASE_URL` | Yes for accounts and persistence | PostgreSQL connection string, with SSL enabled for hosted databases. |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth web client ID verified by the backend. |
| `APP_ORIGINS` | Production required | Comma-separated frontend origins allowed to make state-changing API requests. |
| `SESSION_COOKIE_SECURE` | Production HTTPS | Set to `true` when not running on Vercel; Vercel enables secure cookies automatically. |
| `GEMINI_MODEL` | Optional | Model name; defaults to `gemini-3.5-flash`. |
| `PORT` | Optional | Local backend port; defaults to `3001`. |

**Repository-root `.env`**

Set `VITE_GOOGLE_CLIENT_ID` to the same web client ID to show the Google sign-in button. This client ID is public; do not put Gemini keys, database URLs, or other secrets in frontend variables.

### 2. Start the API

```powershell
npm run dev:backend
```

### 3. Start the frontend

In another terminal at the repository root:

```powershell
npm install
npm run dev
```

Vite prints the local frontend URL (normally `http://localhost:5173`). The API listens on port `3001`.

## Deploy on Vercel

Connect this GitHub repository to Vercel and use the following project settings. Vercel builds from the repository root; the root Vite config points to the frontend in `career-compass/`, and the Express source remains under `career-compass/backend`.

| Vercel setting | Value |
| --- | --- |
| Root Directory | `.` (the repository root; do not select `career-compass`) |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install && npm --prefix career-compass/backend install` |

`vercel.json` includes the install command and rewrites `/api/*` to the Express function. Add these environment variables in the Vercel project settings for **Production** (and Preview if needed):

- `GEMINI_API_KEY`
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID` (optional)
- `APP_ORIGINS` — include the exact production Vercel origin and any custom domain
- `VITE_GOOGLE_CLIENT_ID` — only if enabling Google sign-in in the browser

Environment variables are not uploaded from local `.env` files. Redeploy after changing them. Add the deployed domain to the authorized JavaScript origins in Google Cloud if using Google sign-in.

After deployment, check `https://<your-domain>/api/health`. A ready API returns `{"status":"ok","services":{"accountStorage":"configured","careerAnalysis":"configured"},"missingConfiguration":[]}`. If required environment variables are absent, it returns HTTP 503 with `status:"degraded"` and names the missing variable without exposing its value.

## API overview

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/signup` | Create an account and session |
| `POST` | `/api/auth/login` | Sign in with email and password |
| `POST` | `/api/auth/google` | Sign in with a verified Google credential |
| `GET` | `/api/auth/session` | Check whether a session is active |
| `POST` | `/api/auth/logout` | Revoke the current session |
| `POST` | `/api/analyze-career` | Validate answers and generate/save career analysis |
| `GET` | `/api/assessment/latest` | Load the signed-in user's latest saved assessment |
| `GET`, `PUT` | `/api/progress` | Read or update roadmap progress |
| `POST` | `/api/feedback` | Save signed-in user feedback |

Authenticated routes use an HttpOnly session cookie. See [career-compass/backend/README.md](./career-compass/backend/README.md) for API details and [career-compass/backend/AI_CAREER_ANALYSIS.md](./career-compass/backend/AI_CAREER_ANALYSIS.md) for the model prompt, response contract, and sample output.

## Verify changes

```powershell
npm run test:backend
npm run lint
npm run build
```

## Security and privacy notes

- Keep `.env` and `career-compass/backend/.env` private; only the placeholder `.env.example` files belong in Git.
- Gemini requests are made on the server. Never expose `GEMINI_API_KEY` through Vite or browser code.
- Passwords are stored as scrypt hashes. Session tokens are stored as hashes and sent to browsers in HttpOnly cookies.
- Assessments, progress, and feedback are associated with the authenticated account.
- Career guidance is exploratory and should not be treated as a guarantee or substitute for independent research and advice.

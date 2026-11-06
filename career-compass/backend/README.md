# MargDarshak-AI API

The Express API validates assessment answers and sends them to Gemini from the server. Keep `GEMINI_API_KEY` in this directory's `.env`; never add it to the React app or a `VITE_` variable.

## Run locally

Requires Node.js 20 or newer.

```powershell
cd career-compass\backend
npm install
Copy-Item .env.example .env
```

Add your Gemini API key to `backend/.env`, then run:

```powershell
npm run dev
```

The default model is `gemini-3.5-flash`; override it with `GEMINI_MODEL` only if that model is available to your API key. The API listens on `http://localhost:3001`. In another terminal at the repository root, run `npm run dev` for the React app. Vite proxies `/api` requests to this backend.

Run backend tests with `npm test`; run a production server with `npm start`.

## Deploy on Vercel

The Vercel project root directory should be the repository root (`.`). The root `vercel.json` installs frontend and backend dependencies and sends `/api/*` requests to the Express function in `api/index.js`. Backend source and its package manifest remain under `career-compass/backend`.

Add these values in the Vercel project's Environment Variables settings; do not commit them:

- `GEMINI_API_KEY`: server-side Gemini key.
- `DATABASE_URL`: hosted PostgreSQL connection string.
- `GOOGLE_CLIENT_ID`: optional Google OAuth web client ID.
- `APP_ORIGINS`: comma-separated allowed origins, including the production Vercel domain and any custom domain.

Vercel automatically enables secure session cookies. Redeploy after changing environment variables.

Check `/api/health` after deployment. It reports whether `DATABASE_URL` and `GEMINI_API_KEY` are configured without returning their values; missing settings produce HTTP 503 with a `missingConfiguration` list.

## Endpoint

`POST /api/analyze-career` accepts `educationLevel`, `studyArea`, `interests`, `strengths`, and `workPriority`, using the choices in the assessment form. `careerPathCount` defaults to five and can be set from five to ten; the response contains exactly that many career cards. It returns:

```json
{
  "analysis": {
    "summary": "…",
    "careerSuggestions": ["five or more structured career suggestions, matching careerPathCount"],
    "sixMonthRoadmap": ["exactly six sequential monthly plans"],
    "beginnerProjects": ["exactly three practical projects"]
  }
}
```

See [AI_CAREER_ANALYSIS.md](./AI_CAREER_ANALYSIS.md) for the full system instruction, JSON Schema, complete sample response, and frontend display guidance.

Invalid answers return HTTP 400 with field details. Gemini failures return HTTP 502, and unexpected server errors return HTTP 500; neither response exposes provider details or credentials. `GET /api/health` is available for a basic health check.

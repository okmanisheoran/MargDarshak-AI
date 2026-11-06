import 'dotenv/config'

export const port = Number.parseInt(process.env.PORT ?? '3001', 10)
export const geminiApiKey = process.env.GEMINI_API_KEY
export const geminiModel = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash'
export const databaseUrl = process.env.DATABASE_URL
export const googleClientId = process.env.GOOGLE_CLIENT_ID
export const sessionCookieSecure = process.env.SESSION_COOKIE_SECURE === 'true'
export const allowedOrigins = (process.env.APP_ORIGINS ?? 'http://127.0.0.1:5173,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export function assertRequiredEnvironment() {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is required. Add it to backend/.env before starting the server.')
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port between 1 and 65535.')
  }
}

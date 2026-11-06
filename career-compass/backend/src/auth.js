import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { OAuth2Client } from 'google-auth-library'
import { googleClientId, sessionCookieSecure } from './config/env.js'
import { StorageUnavailableError } from './database.js'

const scrypt = promisify(scryptCallback)
const sessionCookieName = 'margdarshak_session'
const sessionLifetimeSeconds = 60 * 60 * 24 * 14
const dummyPasswordHash = 'scrypt$32768$8$1$ZG9ub3R1c2UtdGhpcy1zYWx0$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
let googleClient

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

export function validateCredentials(input, isSignup) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { data: null, message: 'Please enter valid account details.' }
  }
  const { email, password } = input
  if (typeof email !== 'string' || email.length > 254
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { data: null, message: 'Enter a valid email address.' }
  }
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    return { data: null, message: 'Use a password between 12 and 128 characters.' }
  }

  if (isSignup) {
    if (typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.trim().length > 80) {
      return { data: null, message: 'Enter a name between 2 and 80 characters.' }
    }
    return {
      data: { email: normalizeEmail(email), password, displayName: input.name.trim() },
      message: '',
    }
  }

  return { data: { email: normalizeEmail(email), password }, message: '' }
}

export async function hashPassword(password) {
  const salt = randomBytes(16)
  const derivedKey = await scrypt(password, salt, 64, { N: 32_768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 })
  return `scrypt$32768$8$1$${salt.toString('base64')}$${derivedKey.toString('base64')}`
}

export async function verifyPassword(password, storedHash) {
  const encoded = typeof storedHash === 'string' ? storedHash : dummyPasswordHash
  const [algorithm, n, r, p, saltValue, keyValue] = encoded.split('$')
  if (algorithm !== 'scrypt' || !saltValue || !keyValue) return false
  const expected = Buffer.from(keyValue, 'base64')
  if (expected.length !== 64) return false
  const actual = await scrypt(password, Buffer.from(saltValue, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024,
  })
  return timingSafeEqual(expected, actual)
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function readSessionCookie(request) {
  const cookie = request.headers.cookie?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`))
  if (!cookie) return null
  const token = cookie.slice(sessionCookieName.length + 1)
  return /^[a-f0-9]{64}$/.test(token) ? token : null
}

export function setSessionCookie(response, token) {
  const secure = sessionCookieSecure ? '; Secure' : ''
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${sessionLifetimeSeconds}${secure}`,
  )
}

export function clearSessionCookie(response) {
  const secure = sessionCookieSecure ? '; Secure' : ''
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,
  )
}

export async function createSession(repository, response, userId) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + sessionLifetimeSeconds * 1000)
  await repository.createSession(hashSessionToken(token), userId, expiresAt)
  setSessionCookie(response, token)
}

export async function getSessionUser(request, repository) {
  const token = readSessionCookie(request)
  if (!token) return null
  return repository.getSessionUser(hashSessionToken(token))
}

export async function getGoogleIdentity(credential) {
  if (!googleClientId) throw new StorageUnavailableError('Google sign-in is not configured on the backend.')
  if (typeof credential !== 'string' || credential.length < 20 || credential.length > 8192) {
    return null
  }
  googleClient ??= new OAuth2Client(googleClientId)
  const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: googleClientId })
  const payload = ticket.getPayload()
  if (!payload?.sub || !payload.email || payload.email_verified !== true) return null
  return {
    googleSubject: payload.sub,
    email: normalizeEmail(payload.email),
    displayName: typeof payload.name === 'string' && payload.name.trim()
      ? payload.name.trim().slice(0, 80)
      : payload.email.split('@')[0],
  }
}

export function assertStorageConfigured(repository) {
  if (!repository.isConfigured()) throw new StorageUnavailableError()
}

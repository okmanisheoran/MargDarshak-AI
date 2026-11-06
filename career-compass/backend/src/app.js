import express from 'express'
import { allowedOrigins } from './config/env.js'
import {
  assertStorageConfigured,
  clearSessionCookie,
  createSession,
  getGoogleIdentity,
  getSessionUser,
  hashPassword,
  hashSessionToken,
  readSessionCookie,
  validateCredentials,
  verifyPassword,
} from './auth.js'
import { accountRepository, isStorageConnectionError, StorageUnavailableError } from './database.js'
import { UpstreamServiceError } from './errors.js'
import { generateCareerAnalysis } from './services/geminiCareerAnalysis.js'
import { validateAssessment } from './validation/assessment.js'

function isAllowedOrigin(request) {
  const origin = request.get('origin')
  return !origin || allowedOrigins.includes(origin)
}

async function authenticate(request, repository) {
  assertStorageConfigured(repository)
  return getSessionUser(request, repository)
}

function requireAuthenticatedUser(user) {
  if (!user) {
    const error = new Error('Sign in to continue.')
    error.status = 401
    throw error
  }
  return user
}

export function createApp({ analyzeCareer = generateCareerAnalysis, repository = accountRepository } = {}) {
  const app = express()

  app.use(express.json({ limit: '16kb' }))
  app.use((request, response, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) || isAllowedOrigin(request)) {
      next()
      return
    }
    response.status(403).json({ error: 'INVALID_ORIGIN', message: 'This request origin is not allowed.' })
  })

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' })
  })

  app.get('/api/auth/session', async (request, response) => {
    const user = await authenticate(request, repository)
    response.json({ authenticated: Boolean(user) })
  })

  app.post('/api/auth/signup', async (request, response, next) => {
    const { data, message } = validateCredentials(request.body, true)
    if (!data) {
      response.status(400).json({ error: 'INVALID_ACCOUNT_DETAILS', message })
      return
    }

    try {
      assertStorageConfigured(repository)
      const passwordHash = await hashPassword(data.password)
      const userId = await repository.createUser({
        email: data.email,
        displayName: data.displayName,
        passwordHash,
      })
      await createSession(repository, response, userId)
      response.status(201).json({ authenticated: true })
    } catch (error) {
      if (error.code === '23505') {
        response.status(409).json({ error: 'ACCOUNT_EXISTS', message: 'An account could not be created with those details.' })
        return
      }
      next(error)
    }
  })

  app.post('/api/auth/login', async (request, response, next) => {
    const { data, message } = validateCredentials(request.body, false)
    if (!data) {
      response.status(400).json({ error: 'INVALID_ACCOUNT_DETAILS', message })
      return
    }

    try {
      assertStorageConfigured(repository)
      const user = await repository.getUserByEmail(data.email)
      const passwordMatches = await verifyPassword(data.password, user?.password_hash)
      if (!user || !passwordMatches) {
        response.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' })
        return
      }
      await createSession(repository, response, user.id)
      response.json({ authenticated: true })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/auth/google', async (request, response, next) => {
    try {
      assertStorageConfigured(repository)
      const identity = await getGoogleIdentity(request.body?.credential)
      if (!identity) {
        response.status(401).json({ error: 'INVALID_GOOGLE_CREDENTIAL', message: 'Google sign-in could not be verified. Please try again.' })
        return
      }
      const userId = await repository.createOrGetGoogleUser(identity)
      await createSession(repository, response, userId)
      response.json({ authenticated: true })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/auth/logout', async (request, response, next) => {
    try {
      assertStorageConfigured(repository)
      const token = readSessionCookie(request)
      if (token) await repository.deleteSession(hashSessionToken(token))
      clearSessionCookie(response)
      response.json({ authenticated: false })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/analyze-career', async (request, response, next) => {
    try {
      const user = requireAuthenticatedUser(await authenticate(request, repository))
      const { data, errors } = validateAssessment(request.body)
      if (errors.length > 0) {
        response.status(400).json({
          error: 'INVALID_ASSESSMENT',
          message: 'Please provide valid answers for every assessment question.',
          details: errors,
        })
        return
      }

      const analysis = await analyzeCareer(data)
      const assessmentId = await repository.saveAssessment(user.id, data, analysis)
      response.json({ analysis, assessmentId })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/assessments/latest', async (request, response, next) => {
    try {
      const user = requireAuthenticatedUser(await authenticate(request, repository))
      const assessment = await repository.getLatestAssessment(user.id)
      response.json({ assessment })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/progress', async (request, response, next) => {
    try {
      const user = requireAuthenticatedUser(await authenticate(request, repository))
      response.json({ months: await repository.getProgress(user.id) })
    } catch (error) {
      next(error)
    }
  })

  app.put('/api/progress/:month', async (request, response, next) => {
    try {
      const user = requireAuthenticatedUser(await authenticate(request, repository))
      const month = Number.parseInt(request.params.month, 10)
      if (!Number.isInteger(month) || month < 1 || month > 6
        || String(month) !== request.params.month
        || typeof request.body?.completed !== 'boolean') {
        response.status(400).json({ error: 'INVALID_PROGRESS', message: 'Choose a valid roadmap month and completion state.' })
        return
      }
      const progress = await repository.setProgress(user.id, month, request.body.completed)
      if (!progress) {
        response.status(404).json({ error: 'PROGRESS_NOT_FOUND', message: 'Create a career plan before updating progress.' })
        return
      }
      response.json({ saved: true })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/feedback', async (request, response, next) => {
    try {
      const user = requireAuthenticatedUser(await authenticate(request, repository))
      const rating = request.body?.rating
      const message = typeof request.body?.message === 'string' ? request.body.message.trim() : ''
      if (!Number.isInteger(rating) || rating < 1 || rating > 5 || message.length < 10 || message.length > 2000) {
        response.status(400).json({ error: 'INVALID_FEEDBACK', message: 'Choose a rating and write feedback between 10 and 2,000 characters.' })
        return
      }
      await repository.saveFeedback(user.id, rating, message)
      response.status(201).json({ saved: true })
    } catch (error) {
      next(error)
    }
  })

  app.use((error, _request, response, next) => {
    if (response.headersSent) return next(error)
    if (error.type === 'entity.parse.failed') {
      response.status(400).json({ error: 'INVALID_JSON', message: 'Request body must be valid JSON.' })
      return
    }
    if (error.type === 'entity.too.large') {
      response.status(413).json({ error: 'REQUEST_TOO_LARGE', message: 'Request body must be 16 KB or smaller.' })
      return
    }
    if (error instanceof StorageUnavailableError) {
      response.status(503).json({
        error: 'ACCOUNT_STORAGE_UNAVAILABLE',
        message: error.message,
      })
      return
    }
    if (isStorageConnectionError(error)) {
      response.status(503).json({
        error: 'ACCOUNT_STORAGE_UNAVAILABLE',
        message: 'The account database could not be reached or rejected its credentials. Check the Supabase DATABASE_URL, password encoding, and network settings, then restart the backend.',
      })
      return
    }
    if (error.status === 401) {
      response.status(401).json({ error: 'AUTHENTICATION_REQUIRED', message: error.message })
      return
    }

    console.error('Career analysis request failed:', error.name ?? 'Error')
    if (error instanceof UpstreamServiceError) {
      if (error.cause?.status === 429) {
        response.status(429).json({
          error: 'GEMINI_RATE_LIMITED',
          message: 'Gemini usage limit reached. Check your API project quota or billing settings, or try again later.',
        })
        return
      }

      response.status(502).json({
        error: 'CAREER_ANALYSIS_FAILED',
        message: 'Career analysis is temporarily unavailable. Please try again.',
      })
      return
    }

    response.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred.',
    })
  })

  return app
}

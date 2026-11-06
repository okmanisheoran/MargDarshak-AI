import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { databaseUrl } from './config/env.js'

const { Pool } = pg
let pool

export class StorageUnavailableError extends Error {
  constructor(message = 'Account storage needs a PostgreSQL DATABASE_URL. Add your hosted database connection string to backend/.env and restart the backend; a Google client ID does not replace this database setting.') {
    super(message)
    this.name = 'StorageUnavailableError'
  }
}

function getPool() {
  if (!databaseUrl) throw new StorageUnavailableError()
  pool ??= new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  })
  return pool
}

export function databaseConfigured() {
  return Boolean(databaseUrl)
}

export function isStorageConnectionError(error) {
  const code = typeof error?.code === 'string' ? error.code : ''
  return [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    '28P01',
    '3D000',
  ].includes(code)
    || code.startsWith('08')
    || code.startsWith('ERR_SSL')
    || code.startsWith('CERT_')
}

export async function initializeDatabase() {
  const database = getPool()
  await database.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT,
      google_subject TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (password_hash IS NOT NULL OR google_subject IS NOT NULL)
    );
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash CHAR(64) PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions (expires_at);
    CREATE TABLE IF NOT EXISTS assessments (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      answers JSONB NOT NULL,
      analysis JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS assessments_user_created_idx ON assessments (user_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS learning_progress (
      assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 6),
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (assessment_id, month)
    );
    CREATE TABLE IF NOT EXISTS user_feedback (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
}

export const accountRepository = {
  isConfigured() {
    return Boolean(databaseUrl)
  },

  async createUser({ email, displayName, passwordHash }) {
    const id = randomUUID()
    const result = await getPool().query(
      'INSERT INTO users (id, email, display_name, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
      [id, email, displayName, passwordHash],
    )
    return result.rows[0].id
  },

  async getUserByEmail(email) {
    const result = await getPool().query(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email],
    )
    return result.rows[0] ?? null
  },

  async createOrGetGoogleUser({ email, displayName, googleSubject }) {
    const database = getPool()
    const existing = await database.query(
      'SELECT id FROM users WHERE google_subject = $1 OR email = $2',
      [googleSubject, email],
    )
    if (existing.rows[0]) {
      await database.query(
        'UPDATE users SET google_subject = COALESCE(google_subject, $1), display_name = $2 WHERE id = $3',
        [googleSubject, displayName, existing.rows[0].id],
      )
      return existing.rows[0].id
    }

    const id = randomUUID()
    const result = await database.query(
      'INSERT INTO users (id, email, display_name, google_subject) VALUES ($1, $2, $3, $4) RETURNING id',
      [id, email, displayName, googleSubject],
    )
    return result.rows[0].id
  },

  async createSession(tokenHash, userId, expiresAt) {
    await getPool().query(
      'INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
      [tokenHash, userId, expiresAt],
    )
  },

  async getSessionUser(tokenHash) {
    const result = await getPool().query(
      `SELECT users.id
       FROM auth_sessions
       JOIN users ON users.id = auth_sessions.user_id
       WHERE auth_sessions.token_hash = $1 AND auth_sessions.expires_at > NOW()`,
      [tokenHash],
    )
    return result.rows[0] ?? null
  },

  async deleteSession(tokenHash) {
    await getPool().query('DELETE FROM auth_sessions WHERE token_hash = $1', [tokenHash])
  },

  async saveAssessment(userId, answers, analysis) {
    const database = getPool()
    const id = randomUUID()
    const client = await database.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        'INSERT INTO assessments (id, user_id, answers, analysis) VALUES ($1, $2, $3, $4)',
        [id, userId, answers, analysis],
      )
      for (let month = 1; month <= analysis.sixMonthRoadmap.length; month += 1) {
        await client.query(
          'INSERT INTO learning_progress (assessment_id, user_id, month) VALUES ($1, $2, $3)',
          [id, userId, month],
        )
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    return id
  },

  async getLatestAssessment(userId) {
    const result = await getPool().query(
      `SELECT id, analysis
       FROM assessments
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [userId],
    )
    return result.rows[0] ?? null
  },

  async getProgress(userId) {
    const result = await getPool().query(
      `SELECT assessments.id AS assessment_id, assessments.analysis,
              learning_progress.month, learning_progress.completed, learning_progress.updated_at
       FROM assessments
       JOIN learning_progress ON learning_progress.assessment_id = assessments.id
       WHERE assessments.user_id = $1
         AND assessments.id = (
           SELECT id
           FROM assessments
           WHERE user_id = $1
           ORDER BY created_at DESC, id DESC
           LIMIT 1
         )
       ORDER BY learning_progress.month`,
      [userId],
    )
    return result.rows.map((row) => ({
      month: row.month,
      focus: row.analysis.sixMonthRoadmap[row.month - 1].focus,
      completed: row.completed,
      updatedAt: row.updated_at,
    }))
  },

  async setProgress(userId, month, completed) {
    const result = await getPool().query(
      `UPDATE learning_progress
       SET completed = $3, updated_at = NOW()
       WHERE user_id = $1
         AND month = $2
         AND assessment_id = (
           SELECT id FROM assessments
           WHERE user_id = $1
           ORDER BY created_at DESC, id DESC
           LIMIT 1
         )
       RETURNING month, completed, updated_at`,
      [userId, month, completed],
    )
    return result.rows[0] ?? null
  },

  async saveFeedback(userId, rating, message) {
    await getPool().query(
      'INSERT INTO user_feedback (id, user_id, rating, message) VALUES ($1, $2, $3, $4)',
      [randomUUID(), userId, rating, message],
    )
  },
}

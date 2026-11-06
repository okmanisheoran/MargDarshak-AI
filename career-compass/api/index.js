import { createApp } from '../backend/src/app.js'
import { databaseConfigured, initializeDatabase } from '../backend/src/database.js'

const app = createApp()
let databaseInitialization

function restoreApiPath(request) {
  const path = request.query?.path
  if (typeof path !== 'string') return

  const originalUrl = new URL(request.url, 'http://localhost')
  originalUrl.searchParams.delete('path')
  const suffix = originalUrl.search
  request.url = `/api/${path.replace(/^\/+/, '')}${suffix}`
}

export default async function handler(request, response) {
  restoreApiPath(request)

  try {
    if (databaseConfigured()) {
      databaseInitialization ??= initializeDatabase().catch((error) => {
        databaseInitialization = undefined
        throw error
      })
      await databaseInitialization
    }
  } catch (error) {
    console.error('Could not initialize PostgreSQL account storage.', error.code ?? error.name)
    response.status(503).json({
      error: 'ACCOUNT_STORAGE_UNAVAILABLE',
      message: 'The account database could not be reached. Check the Vercel DATABASE_URL setting.',
    })
    return
  }

  app(request, response)
}

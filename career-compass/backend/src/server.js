import { createApp } from './app.js'
import { assertRequiredEnvironment, port } from './config/env.js'
import { initializeDatabase, databaseConfigured } from './database.js'

try {
  assertRequiredEnvironment()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

try {
  if (databaseConfigured()) {
    await initializeDatabase()
  } else {
    console.warn('DATABASE_URL is not set; account features are unavailable until backend storage is configured.')
  }
} catch (error) {
  console.error('Could not initialize PostgreSQL account storage. Check DATABASE_URL, the URL-encoded database password, Supabase host and port, SSL settings, and network access.')
  if (typeof error.code === 'string') console.error(`Database error code: ${error.code}`)
  process.exit(1)
}

const app = createApp()
app.listen(port, () => {
  console.log(`MargDarshak-AI API listening on http://localhost:${port}`)
})

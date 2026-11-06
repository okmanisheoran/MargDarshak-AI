import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseJsonResponse } from '../../src/api.js'

test('API response parser returns valid JSON objects', async () => {
  const response = new Response(JSON.stringify({ authenticated: true }), {
    headers: { 'content-type': 'application/json' },
  })

  assert.deepEqual(await parseJsonResponse(response, 'Account service'), { authenticated: true })
})

test('API response parser uses a JSON error message for failed responses', async () => {
  const response = new Response(JSON.stringify({ message: 'Database is not configured.' }), {
    status: 503,
    headers: { 'content-type': 'application/json' },
  })

  await assert.rejects(parseJsonResponse(response, 'Account service'), /Database is not configured/)
})

test('API response parser explains HTML responses instead of exposing an unexpected token error', async () => {
  const response = new Response('<!doctype html><title>Not found</title>', {
    status: 404,
    headers: { 'content-type': 'text/html' },
  })

  await assert.rejects(
    parseJsonResponse(response, 'Account service'),
    /non-JSON response \(HTTP 404, text\/html\).*\/api route points to the backend/s,
  )
})

test('API response parser rejects empty successful responses clearly', async () => {
  await assert.rejects(
    parseJsonResponse(new Response(null), 'Progress service'),
    /Progress service returned an empty or invalid JSON response/,
  )
})

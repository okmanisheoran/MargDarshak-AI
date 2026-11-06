export async function parseJsonResponse(response, serviceName = 'API') {
  const responseText = await response.text()
  let result = null

  if (responseText.trim()) {
    try {
      result = JSON.parse(responseText)
    } catch {
      const contentType = response.headers.get('content-type') ?? 'unknown content type'
      throw new Error(
        `${serviceName} returned a non-JSON response (HTTP ${response.status}, ${contentType}). `
        + 'Check that the deployed /api route points to the backend and not a frontend error page.',
      )
    }
  }

  if (!response.ok) {
    throw new Error(
      typeof result?.message === 'string'
        ? result.message
        : `${serviceName} request failed with HTTP ${response.status}.`,
    )
  }

  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error(`${serviceName} returned an empty or invalid JSON response.`)
  }

  return result
}

export async function requestJson(url, options, serviceName = 'API') {
  const response = await fetch(url, options)
  return parseJsonResponse(response, serviceName)
}

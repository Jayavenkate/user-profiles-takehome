// Small wrapper around fetch so components never deal with URLs, headers or
// error parsing themselves.

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    // For 400 responses this holds the field errors, e.g. { email: ['...'] }.
    this.data = data
  }
}

function errorMessage(status, data) {
  if (data && typeof data.detail === 'string') return data.detail
  if (status === 400) return 'Please fix the highlighted fields.'
  if (status === 404) return 'Not found.'
  return `Request failed (${status}).`
}

export async function request(path, { method = 'GET', params, body, signal } = {}) {
  const url = new URL(`${API_URL}${path}`)
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })

  const options = { method, signal, headers: { Accept: 'application/json' } }
  if (body instanceof FormData) {
    // Let the browser set the multipart Content-Type (it adds the boundary).
    options.body = body
  } else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(url, options)
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Could not reach the server. Is the backend running?', 0, null)
  }

  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(errorMessage(response.status, data), response.status, data)
  return data
}

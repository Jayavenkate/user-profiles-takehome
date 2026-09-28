import { request } from './client'

export function listProfiles({ page, pageSize, search } = {}, signal) {
  return request('/profiles/', { params: { page, page_size: pageSize, search }, signal })
}

export function getProfile(id, signal) {
  return request(`/profiles/${id}/`, { signal })
}

// `data` is FormData (so an image can be included) or a plain object.
export function createProfile(data) {
  return request('/profiles/', { method: 'POST', body: data })
}

export function updateProfile(id, data) {
  return request(`/profiles/${id}/`, { method: 'PATCH', body: data })
}

export function deleteProfile(id) {
  return request(`/profiles/${id}/`, { method: 'DELETE' })
}

export function importProfiles(file) {
  const body = new FormData()
  body.append('file', file)
  return request('/profiles/import/', { method: 'POST', body })
}

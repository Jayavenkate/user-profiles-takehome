import { request } from './client'

// `filters` holds the extra list params (department, is_active, created_after, ...).
export function listProfiles({ page, pageSize, search, ordering, filters } = {}, signal) {
  return request('/profiles/', { params: { page, page_size: pageSize, search, ordering, ...filters }, signal })
}

export function listDepartments(signal) {
  return request('/profiles/departments/', { signal })
}

export function listCountries(signal) {
  return request('/profiles/countries/', { signal })
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

// Client-side checks that mirror the API rules, so most mistakes are caught
// before a request is sent. The API still validates everything.

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
export const MAX_IMAGE_SIZE_MB = 5

const REQUIRED_FIELDS = {
  username: 'Username',
  email: 'Email',
  first_name: 'First name',
  last_name: 'Last name',
  gender: 'Gender',
  date_of_birth: 'Date of birth',
  job_title: 'Job title',
  department: 'Department',
  city: 'City',
  country: 'Country',
  hire_date: 'Hire date',
}

const USERNAME_PATTERN = /^[\w.@+-]+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function todayISO() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

/** Returns an error message for the file, or null if it is acceptable. */
export function validateImage(file) {
  if (!file) return null
  const extension = file.name.split('.').pop().toLowerCase()
  if (!ALLOWED_IMAGE_TYPES.includes(file.type) || !ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    return 'Only JPG, JPEG, PNG and WEBP images are allowed.'
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `Image must be ${MAX_IMAGE_SIZE_MB} MB or smaller.`
  }
  return null
}

/** Returns { field: message } for every problem found; empty object means valid. */
export function validateProfile(values, imageFile) {
  const errors = {}

  Object.entries(REQUIRED_FIELDS).forEach(([field, label]) => {
    if (!String(values[field] ?? '').trim()) errors[field] = `${label} is required.`
  })

  if (values.username && !USERNAME_PATTERN.test(values.username.trim())) {
    errors.username = 'Use letters, numbers and . @ + - _ only (no spaces).'
  }
  if (values.email && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (values.date_of_birth && values.date_of_birth >= todayISO()) {
    errors.date_of_birth = 'Date of birth must be in the past.'
  }
  if (values.date_of_birth && values.hire_date && values.hire_date <= values.date_of_birth) {
    errors.hire_date = 'Hire date must be after date of birth.'
  }

  const imageError = validateImage(imageFile)
  if (imageError) errors.profile_image = imageError

  return errors
}

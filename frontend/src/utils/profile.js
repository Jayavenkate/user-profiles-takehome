export function fullName(profile) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username
}

// { email: ['Enter a valid email.'], date_of_birth: ['Bad date.'] }
//   -> ['email: Enter a valid email.', 'date of birth: Bad date.']
export function describeErrors(errors) {
  if (!errors || typeof errors !== 'object') return []
  return Object.entries(errors).flatMap(([field, messages]) => {
    const label = field === 'non_field_errors' ? '' : `${field.replaceAll('_', ' ')}: `
    return [].concat(messages).map((message) => `${label}${message}`)
  })
}

// "1990-04-05" -> "5 Apr 1990". Parsed as a local date so it never shifts a day by timezone.
export function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '—'
}

export function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : '—'
}

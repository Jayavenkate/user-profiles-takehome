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

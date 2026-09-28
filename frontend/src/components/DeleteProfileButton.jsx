import { useState } from 'react'

import { deleteProfile } from '../api/profiles'
import { fullName } from '../utils/profile'

/** Asks for confirmation, deletes the profile, then calls onDeleted / onError. */
export default function DeleteProfileButton({ profile, onDeleted, onError, className = '' }) {
  const [deleting, setDeleting] = useState(false)

  async function handleClick() {
    const name = fullName(profile)
    if (!window.confirm(`Delete ${name}? This also deletes their user account and cannot be undone.`)) return

    setDeleting(true)
    try {
      await deleteProfile(profile.id)
      onDeleted?.(profile)
    } catch (error) {
      setDeleting(false)
      onError?.(`Could not delete ${name}: ${error.message}`)
    }
  }

  return (
    <button type="button" className={`button button-danger ${className}`} onClick={handleClick} disabled={deleting}>
      {deleting ? 'Deleting…' : 'Delete'}
    </button>
  )
}

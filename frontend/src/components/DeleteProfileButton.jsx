import { useState } from 'react'

import { deleteProfile } from '../api/profiles'
import { fullName } from '../utils/profile'
import ConfirmDialog from './ConfirmDialog'

/** Asks for confirmation in a modal, deletes the profile, then calls onDeleted / onError. */
export default function DeleteProfileButton({ profile, onDeleted, onError, className = '' }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const name = fullName(profile)

  async function handleConfirm() {
    setDeleting(true)
    try {
      await deleteProfile(profile.id)
      onDeleted?.(profile)
    } catch (error) {
      setDeleting(false)
      setConfirming(false)
      onError?.(`Could not delete ${name}: ${error.message}`)
    }
  }

  return (
    <>
      <button type="button" className={`button button-danger ${className}`} onClick={() => setConfirming(true)} disabled={deleting}>
        Delete
      </button>
      {confirming && (
        <ConfirmDialog
          title={`Delete ${name}?`}
          message="This also deletes their user account and cannot be undone."
          busy={deleting}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  )
}

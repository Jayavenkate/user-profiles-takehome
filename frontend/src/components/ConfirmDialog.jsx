import { useEffect, useRef } from 'react'

import { TrashIcon } from './Icons'
import Spinner from './Spinner'

/**
 * Centred yes / no modal for destructive actions. The parent mounts it only while open.
 * While `busy`, the buttons are disabled and Esc / backdrop clicks are ignored,
 * so the dialog stays up until the request finishes.
 */
export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', busyLabel = 'Deleting…', busy = false, onConfirm, onCancel }) {
  const dialogRef = useRef(null)

  // showModal() gives us the backdrop, focus trapping and Esc-to-close for free.
  useEffect(() => {
    dialogRef.current.showModal()
  }, [])

  function cancel() {
    if (!busy) onCancel()
  }

  // A click on the dialog element itself (not its contents) is a click on the backdrop.
  function handleClick(event) {
    if (event.target === dialogRef.current) cancel()
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      onCancel={(event) => {
        event.preventDefault()
        cancel()
      }}
      onClick={handleClick}
    >
      <div className="confirm-panel">
        <span className="confirm-icon"><TrashIcon size={22} /></span>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-message">{message}</p>
        <div className="confirm-actions">
          {/* Cancel gets focus first, so pressing Enter by accident doesn't delete. */}
          <button type="button" className="button" onClick={cancel} disabled={busy} autoFocus>
            Cancel
          </button>
          <button type="button" className="button button-danger-solid" onClick={onConfirm} disabled={busy}>
            {busy ? <Spinner label={busyLabel} /> : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}

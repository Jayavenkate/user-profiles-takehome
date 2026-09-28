import { useRef, useState } from 'react'

import ProfileImage from '../ProfileImage'

/**
 * Shows what the profile image will be after saving:
 * the newly chosen file, the current image, or the placeholder.
 * A file can be picked with the button or dropped onto the row.
 */
export default function ImageInput({ previewUrl, currentUrl, removed, name, error, onSelect, onClearSelection, onRemove, onUndoRemove }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const shownUrl = previewUrl || (removed ? null : currentUrl)
  // One quiet line under the buttons: pending changes win over the file-type hint.
  let note = 'JPG, PNG or WEBP · Max 5 MB'
  if (previewUrl) note = 'New photo — not saved yet'
  else if (removed) note = 'Will be removed when you save'

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onSelect(file)
  }

  return (
    <div
      className={`image-drop${dragging ? ' is-dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <ProfileImage src={shownUrl} name={name} size={64} />
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          onSelect(event.target.files[0] || null)
          event.target.value = ''
        }}
      />

      <div className="image-drop-text">
        <div className="image-input-buttons">
          <button
            type="button"
            id="field-profile_image"
            className="button button-small"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'field-profile_image-error' : 'field-profile_image-hint'}
            onClick={() => inputRef.current.click()}
          >
            {shownUrl ? 'Change' : 'Upload photo'}
          </button>
          {previewUrl && (
            <button type="button" className="button button-small button-ghost" onClick={onClearSelection}>Cancel</button>
          )}
          {!previewUrl && currentUrl && !removed && (
            <button type="button" className="button button-small button-ghost button-danger" onClick={onRemove}>Remove</button>
          )}
          {!previewUrl && removed && (
            <button type="button" className="button button-small button-ghost" onClick={onUndoRemove}>Undo</button>
          )}
        </div>
        <p id="field-profile_image-hint" className="field-hint">{note}</p>
        {error && <p id="field-profile_image-error" className="field-error">{error}</p>}
      </div>
    </div>
  )
}

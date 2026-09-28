import { useRef } from 'react'

import ProfileImage from '../ProfileImage'

/**
 * Shows what the profile image will be after saving:
 * the newly chosen file, the current image, or the placeholder.
 */
export default function ImageInput({ previewUrl, currentUrl, removed, name, error, onSelect, onClearSelection, onRemove, onUndoRemove }) {
  const inputRef = useRef(null)
  const shownUrl = previewUrl || (removed ? null : currentUrl)
  let status = 'No image'
  if (previewUrl) status = 'New image selected (not saved yet)'
  else if (removed) status = 'Image will be removed when you save'
  else if (currentUrl) status = 'Current image'

  return (
    <div className="image-input">
      <ProfileImage src={shownUrl} name={name} size={96} />
      <div className="image-input-controls">
        <p className="muted">{status}</p>
        <div className="image-input-buttons">
          <input
            ref={inputRef}
            id="field-profile_image"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => {
              onSelect(event.target.files[0] || null)
              event.target.value = ''
            }}
          />
          <button type="button" className="button" aria-invalid={Boolean(error)} onClick={() => inputRef.current.click()}>
            {shownUrl ? 'Change image' : 'Choose image'}
          </button>
          {previewUrl && (
            <button type="button" className="button" onClick={onClearSelection}>Cancel new image</button>
          )}
          {!previewUrl && currentUrl && !removed && (
            <button type="button" className="button button-danger" onClick={onRemove}>Remove image</button>
          )}
          {!previewUrl && removed && (
            <button type="button" className="button" onClick={onUndoRemove}>Undo remove</button>
          )}
        </div>
        <p className="field-hint">JPG, PNG or WEBP, up to 5 MB. Optional.</p>
        {error && <p className="field-error">{error}</p>}
      </div>
    </div>
  )
}

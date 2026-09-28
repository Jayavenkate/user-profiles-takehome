import { useEffect, useRef } from 'react'

import { describeErrors } from '../utils/profile'
import { CheckIcon, CloseIcon, WarningIcon } from './Icons'

/**
 * Import summary in its own modal, so a long list of failures doesn't push the table down.
 * The parent mounts it only while there is a result to show.
 */
export default function ImportResult({ result, onClose }) {
  const { total, imported_count, skipped_count, failed_count, failed, skipped } = result
  const dialogRef = useRef(null)

  // showModal() gives us the backdrop, focus trapping and Esc-to-close for free.
  useEffect(() => {
    dialogRef.current.showModal()
  }, [])

  // A click on the dialog element itself (not its contents) is a click on the backdrop.
  function handleClick(event) {
    if (event.target === dialogRef.current) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="import-dialog"
      aria-labelledby="import-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={handleClick}
    >
      <div className="import-dialog-header">
        <span className={`import-dialog-icon${failed_count > 0 ? ' is-warning' : ''}`}>
          {failed_count > 0 ? <WarningIcon size={20} /> : <CheckIcon size={20} />}
        </span>
        <div>
          <h2 id="import-title">Import finished</h2>
          <p className="muted">{total} {total === 1 ? 'record' : 'records'} in the file</p>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
          <CloseIcon size={18} />
        </button>
      </div>

      <div className="import-dialog-body">
        <div className="import-stats">
          <div className="import-stat is-success">
            <span className="import-stat-value">{imported_count}</span>
            <span className="import-stat-label">Imported</span>
          </div>
          <div className="import-stat">
            <span className="import-stat-value">{skipped_count}</span>
            <span className="import-stat-label">Skipped</span>
          </div>
          <div className={`import-stat${failed_count > 0 ? ' is-danger' : ''}`}>
            <span className="import-stat-value">{failed_count}</span>
            <span className="import-stat-label">Failed</span>
          </div>
        </div>

        {failed_count > 0 && (
          <section>
            <h3>Failed rows</h3>
            <div className="import-table-wrap">
              <table className="table table-compact">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Username</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {failed.map((item) => (
                    <tr key={item.row}>
                      <td>{item.row}</td>
                      <td>{item.username || <em>missing</em>}</td>
                      <td>{describeErrors(item.errors).join('; ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {skipped_count > 0 && (
          <details className="import-skipped">
            <summary>{skipped_count} skipped because the username already exists</summary>
            <p className="muted">{skipped.map((item) => item.username).join(', ')}</p>
          </details>
        )}
      </div>

      <div className="import-dialog-footer">
        <button type="button" className="button button-primary" onClick={onClose} autoFocus>Done</button>
      </div>
    </dialog>
  )
}

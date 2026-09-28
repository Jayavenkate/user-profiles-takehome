import { describeErrors } from '../utils/profile'

export default function ImportResult({ result, onClose }) {
  const { total, imported_count, skipped_count, failed_count, failed, skipped } = result
  const tone = failed_count > 0 ? 'alert-warning' : 'alert-success'

  return (
    <div className={`alert ${tone} import-result`} role="status">
      <div className="import-result-header">
        <strong>
          Import finished: {imported_count} imported, {skipped_count} skipped, {failed_count} failed
          {' '}(of {total} records)
        </strong>
        <button type="button" className="link-button" onClick={onClose}>Dismiss</button>
      </div>

      {failed_count > 0 && (
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
      )}

      {skipped_count > 0 && (
        <details>
          <summary>{skipped_count} skipped because the username already exists</summary>
          <p className="muted">{skipped.map((item) => item.username).join(', ')}</p>
        </details>
      )}
    </div>
  )
}

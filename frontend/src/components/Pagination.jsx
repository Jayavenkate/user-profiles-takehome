import { PAGE_SIZES } from '../constants'

export default function Pagination({ page, pageSize, count, hasPrevious, hasNext, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const first = count === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, count)

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="muted">
        Showing {first}–{last} of {count}
      </span>
      <div className="pagination-controls">
        <label className="page-size">
          Per page
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
        <button type="button" className="button" disabled={!hasPrevious} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button type="button" className="button" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </nav>
  )
}

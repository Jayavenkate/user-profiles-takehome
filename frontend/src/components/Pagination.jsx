import { PAGE_SIZES } from '../constants'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

export default function Pagination({ page, pageSize, count, hasPrevious, hasNext, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const first = count === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, count)

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="muted">Page {page} of {totalPages}</span>
      <div className="pagination-box">
        <label className="page-size">
          Rows per page:
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
        <span className="page-range">{first}–{last} of {count}</span>
        <div className="pagination-controls">
          <button
            type="button"
            className="icon-button"
            disabled={!hasPrevious}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeftIcon size={18} />
          </button>
          <button
            type="button"
            className="icon-button"
            disabled={!hasNext}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRightIcon size={18} />
          </button>
        </div>
      </div>
    </nav>
  )
}

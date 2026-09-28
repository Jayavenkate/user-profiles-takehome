import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { listProfiles } from '../api/profiles'
import ImportButton from '../components/ImportButton'
import ImportResult from '../components/ImportResult'
import Pagination from '../components/Pagination'
import ProfileTable from '../components/ProfileTable'
import SearchBar from '../components/SearchBar'
import { PAGE_SIZES } from '../constants'
import useFetch from '../hooks/useFetch'
import useFlashMessage from '../hooks/useFlashMessage'
import { fullName } from '../utils/profile'

function readPositiveInt(value, fallback) {
  const number = Number.parseInt(value, 10)
  return Number.isInteger(number) && number > 0 ? number : fallback
}

export default function ProfileListPage() {
  // The URL is the single source of truth for page, page size and search,
  // so refresh and back/forward always show the same list.
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPositiveInt(searchParams.get('page'), 1)
  const requestedSize = readPositiveInt(searchParams.get('page_size'), PAGE_SIZES[0])
  const pageSize = PAGE_SIZES.includes(requestedSize) ? requestedSize : PAGE_SIZES[0]
  const search = searchParams.get('search') || ''

  const [message, setMessage] = useFlashMessage()
  const [actionError, setActionError] = useState(null)
  const [importResult, setImportResult] = useState(null)

  const { data, error, loading, reload } = useFetch(
    (signal) => listProfiles({ page, pageSize, search }, signal),
    [page, pageSize, search],
  )

  // Only non-default values go in the URL, to keep it short.
  function updateParams(changes) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      Object.entries(changes).forEach(([key, value]) => {
        const isDefault = !value || (key === 'page' && value === 1) || (key === 'page_size' && value === PAGE_SIZES[0])
        if (isDefault) next.delete(key)
        else next.set(key, value)
      })
      return next
    })
  }

  function handleDeleted(profile) {
    setActionError(null)
    setMessage(`${fullName(profile)} was deleted.`)
    // If that was the last row on this page, step back a page.
    if (data?.results.length === 1 && page > 1) updateParams({ page: page - 1 })
    else reload()
  }

  function handleImported(summary) {
    setMessage(null)
    setActionError(null)
    setImportResult(summary)
    if (summary.imported_count > 0) reload()
  }

  function handleImportError(errorMessage) {
    setImportResult(null)
    setActionError(`Import failed: ${errorMessage}`)
  }

  return (
    <>
      <div className="page-header">
        <h1>Profiles</h1>
        <div className="header-actions">
          <ImportButton onImported={handleImported} onError={handleImportError} />
          <Link to="/profiles/new" className="button button-primary">New profile</Link>
        </div>
      </div>

      {message && (
        <div className="alert alert-success" role="status">
          {message}
          <button type="button" className="link-button" onClick={() => setMessage(null)}>Dismiss</button>
        </div>
      )}
      {actionError && (
        <div className="alert alert-error" role="alert">
          {actionError}
          <button type="button" className="link-button" onClick={() => setActionError(null)}>Dismiss</button>
        </div>
      )}
      {importResult && <ImportResult result={importResult} onClose={() => setImportResult(null)} />}

      <div className="toolbar">
        <SearchBar key={search} value={search} onSearch={(term) => updateParams({ search: term, page: 1 })} />
        {loading && data && <span className="muted">Loading…</span>}
      </div>

      <ListContent
        data={data}
        error={error}
        loading={loading}
        page={page}
        search={search}
        onRetry={reload}
        onFirstPage={() => updateParams({ page: 1 })}
        onClearSearch={() => updateParams({ search: '', page: 1 })}
      >
        {data && (
          <>
            <ProfileTable profiles={data.results} onDeleted={handleDeleted} onDeleteError={setActionError} />
            <Pagination
              page={page}
              pageSize={pageSize}
              count={data.count}
              hasPrevious={Boolean(data.previous)}
              hasNext={Boolean(data.next)}
              onPageChange={(nextPage) => updateParams({ page: nextPage })}
              onPageSizeChange={(size) => updateParams({ page_size: size, page: 1 })}
            />
          </>
        )}
      </ListContent>
    </>
  )
}

/** Decides which state to show: loading, error, the two empty states, or the table. */
function ListContent({ data, error, loading, page, search, onRetry, onFirstPage, onClearSearch, children }) {
  if (error) {
    if (error.status === 404 && page > 1) {
      return (
        <div className="state-box">
          <h2>This page doesn&apos;t exist</h2>
          <p>There are fewer pages than that.</p>
          <button type="button" className="button" onClick={onFirstPage}>Go to first page</button>
        </div>
      )
    }
    return (
      <div className="state-box" role="alert">
        <h2>Could not load profiles</h2>
        <p>{error.message}</p>
        <button type="button" className="button" onClick={onRetry}>Try again</button>
      </div>
    )
  }

  if (loading && !data) {
    return <div className="state-box">Loading profiles…</div>
  }

  if (data.count === 0) {
    if (search) {
      return (
        <div className="state-box">
          <h2>No profiles match “{search}”</h2>
          <p>Try a different name, username or email.</p>
          <button type="button" className="button" onClick={onClearSearch}>Clear search</button>
        </div>
      )
    }
    return (
      <div className="state-box">
        <h2>No profiles yet</h2>
        <p>Create the first profile, or use “Import JSON” to load the sample data.</p>
        <Link to="/profiles/new" className="button button-primary">New profile</Link>
      </div>
    )
  }

  return <div className={loading ? 'is-loading' : undefined}>{children}</div>
}

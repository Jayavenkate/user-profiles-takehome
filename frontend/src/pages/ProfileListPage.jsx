import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { deleteProfile, listProfiles } from '../api/profiles'
import ConfirmDialog from '../components/ConfirmDialog'
import FilterDrawer from '../components/FilterDrawer'
import { CloseIcon, EditIcon, EyeIcon, FilterIcon, TrashIcon } from '../components/Icons'
import ImportButton from '../components/ImportButton'
import ImportResult from '../components/ImportResult'
import Pagination from '../components/Pagination'
import ProfileTable from '../components/ProfileTable'
import Spinner, { LoadingState } from '../components/Spinner'
import useToast from '../hooks/useToast'
import SearchBar from '../components/SearchBar'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, SORT_FIELDS } from '../constants'
import useFetch from '../hooks/useFetch'
import { EMPTY_FILTERS, FILTER_KEYS, countActiveFilters, describeFilters, readFilters, toApiParams } from '../utils/filters'
import { fullName } from '../utils/profile'

function readPositiveInt(value, fallback) {
  const number = Number.parseInt(value, 10)
  return Number.isInteger(number) && number > 0 ? number : fallback
}

// "-created_at" -> { field: 'created_at', descending: true }. Unknown fields mean the default order.
function readOrdering(value) {
  const field = (value || '').replace(/^-/, '')
  return SORT_FIELDS.includes(field) ? { field, descending: value.startsWith('-') } : null
}

export default function ProfileListPage() {
  // The URL is the single source of truth for page, page size, search, sort and filters,
  // so refresh and back/forward always show the same list.
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPositiveInt(searchParams.get('page'), 1)
  const requestedSize = readPositiveInt(searchParams.get('page_size'), DEFAULT_PAGE_SIZE)
  const pageSize = PAGE_SIZES.includes(requestedSize) ? requestedSize : DEFAULT_PAGE_SIZE
  const search = searchParams.get('search') || ''
  const sort = readOrdering(searchParams.get('ordering'))
  const ordering = sort ? `${sort.descending ? '-' : ''}${sort.field}` : ''
  const filters = readFilters(searchParams)
  const filterKey = FILTER_KEYS.map((key) => filters[key]).join('|')
  const activeFilterCount = countActiveFilters(filters)

  const navigate = useNavigate()
  const showToast = useToast()
  const [importResult, setImportResult] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [busy, setBusy] = useState(null) // 'deleting' | null
  const [deleteTargets, setDeleteTargets] = useState(null) // profiles waiting for the confirm dialog

  const { data, error, loading, reload } = useFetch(
    (signal) => listProfiles({ page, pageSize, search, ordering, filters: toApiParams(filters) }, signal),
    [page, pageSize, search, ordering, filterKey],
  )

  // Ticked rows belong to one view of the list: changing page, search or filters starts a
  // new selection. Ids that are no longer on the page (e.g. just deleted) are dropped too.
  const listKey = searchParams.toString()
  const [selection, setSelection] = useState({ key: listKey, ids: [] })
  const pageProfiles = data?.results || []
  // A body without a results list (empty or unexpected response) is treated as "no data".
  const hasList = Array.isArray(data?.results)
  // The directory itself is empty (not just a search with no matches): the toolbar has nothing to act on.
  const directoryEmpty = !search && !activeFilterCount && page === 1 &&
    (error ? error.status === 404 : Boolean(data) && !data.results?.length)
  const selectedIds = selection.key === listKey
    ? selection.ids.filter((id) => pageProfiles.some((profile) => profile.id === id))
    : []
  const selectedProfiles = pageProfiles.filter((profile) => selectedIds.includes(profile.id))
  const singleSelected = selectedProfiles.length === 1 ? selectedProfiles[0] : null

  function setSelectedIds(ids) {
    setSelection({ key: listKey, ids })
  }

  // Only non-default values go in the URL, to keep it short. `replace` swaps the current
  // history entry instead of adding one (used while typing, so Back isn't one step per pause).
  function updateParams(changes, { replace = false } = {}) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      Object.entries(changes).forEach(([key, value]) => {
        const isDefault = !value || (key === 'page' && value === 1) || (key === 'page_size' && value === DEFAULT_PAGE_SIZE)
        if (isDefault) next.delete(key)
        else next.set(key, value)
      })
      return next
    }, { replace })
  }

  // Clicking a column sorts by it ascending; clicking it again flips the direction.
  function handleSort(field) {
    const descending = sort?.field === field && !sort.descending
    updateParams({ ordering: `${descending ? '-' : ''}${field}`, page: 1 })
  }

  function applyFilters(nextFilters) {
    setFilterOpen(false)
    updateParams({ ...nextFilters, page: 1 })
  }

  function clearFilterKeys(keys) {
    updateParams({ ...Object.fromEntries(keys.map((key) => [key, ''])), page: 1 })
  }

  // The toolbar buttons are never disabled. If the selection doesn't fit, say what to do.
  function showHint(text) {
    showToast(text, { tone: 'info' })
  }

  function openSelected(mode) {
    if (!singleSelected) {
      showHint(selectedProfiles.length > 1
        ? `Tick just one profile to ${mode} it.`
        : `Tick a profile first, then click ${mode === 'view' ? 'View' : 'Edit'}.`)
      return
    }
    const path = mode === 'view' ? `/profiles/${singleSelected.id}` : `/profiles/${singleSelected.id}/edit`
    // `from` lets the profile's Back link return to this exact page, search and filters.
    navigate(path, { state: { from: `/?${searchParams.toString()}`.replace(/\?$/, '') } })
  }

  function handleDeleteSelected() {
    if (busy) return
    if (selectedProfiles.length === 0) {
      showHint('Tick the profiles you want to delete, then click Delete.')
      return
    }
    setDeleteTargets(selectedProfiles)
  }

  async function confirmDelete() {
    const targets = deleteTargets
    setBusy('deleting')
    const failed = []
    for (const profile of targets) {
      try {
        await deleteProfile(profile.id)
      } catch (err) {
        failed.push(`${fullName(profile)} (${err.message})`)
      }
    }
    setBusy(null)
    setDeleteTargets(null)

    const deletedCount = targets.length - failed.length
    if (deletedCount > 0) {
      showToast(deletedCount === 1 && targets.length === 1
        ? `${fullName(targets[0])} was deleted.`
        : `${deletedCount} ${deletedCount === 1 ? 'profile was' : 'profiles were'} deleted.`)
    }
    if (failed.length > 0) showToast(`Could not delete ${failed.join(', ')}.`, { tone: 'error' })

    // If the whole page was removed, step back a page.
    if (deletedCount === pageProfiles.length && page > 1) updateParams({ page: page - 1 })
    else reload()
  }

  function handleImported(summary) {
    setImportResult(summary)
    if (summary.imported_count > 0) reload()
  }

  function handleImportError(errorMessage) {
    setImportResult(null)
    showToast(`Import failed: ${errorMessage}`, { tone: 'error' })
  }

  const filterChips = describeFilters(filters)

  return (
    <div className="list-page">
      <div className="page-header">
        <div>
          <h1>Profiles</h1>
          <p className="page-subtitle">
            {!hasList && 'Everyone in the directory'}
            {hasList && !search && !activeFilterCount && `${data.count} ${data.count === 1 ? 'person' : 'people'} in the directory`}
            {hasList && (search || activeFilterCount > 0) && `${data.count} ${data.count === 1 ? 'match' : 'matches'}${search ? ` for “${search}”` : ''}`}
          </p>
        </div>
        <ImportButton onImported={handleImported} onError={handleImportError} />
      </div>

      {importResult && <ImportResult result={importResult} onClose={() => setImportResult(null)} />}

      <section className="panel">
        {!directoryEmpty && <div className="toolbar">
          <div className="header-actions" role="toolbar" aria-label="Profile actions">
            <button type="button" className="button toolbar-button" onClick={() => openSelected('view')}>
              <EyeIcon />
              View
            </button>
            <button type="button" className="button toolbar-button" onClick={() => openSelected('edit')}>
              <EditIcon />
              Edit
            </button>
            <button type="button" className="button toolbar-button" aria-busy={busy === 'deleting'} onClick={handleDeleteSelected}>
              <TrashIcon />
              {busy === 'deleting' ? 'Deleting…' : selectedProfiles.length > 1 ? `Delete (${selectedProfiles.length})` : 'Delete'}
            </button>
          </div>
          <div className="toolbar-end">
            {loading && data && <span className="muted"><Spinner label="Loading…" /></span>}
            <button
              type="button"
              className={`button${activeFilterCount ? ' button-filter-active' : ''}`}
              onClick={() => setFilterOpen(true)}
              aria-haspopup="dialog"
            >
              <FilterIcon />
              Filter
              {activeFilterCount > 0 && <span className="count-badge" aria-label={`${activeFilterCount} active`}>{activeFilterCount}</span>}
            </button>
            <SearchBar value={search} onSearch={(term, options) => updateParams({ search: term, page: 1 }, options)} />
          </div>
        </div>}

        {filterChips.length > 0 && (
          <div className="filter-chips" aria-label="Active filters">
            {filterChips.map((chip) => (
              <span key={chip.label} className="chip">
                {chip.label}
                <button type="button" onClick={() => clearFilterKeys(chip.keys)} aria-label={`Remove filter ${chip.label}`}>
                  <CloseIcon size={14} />
                </button>
              </span>
            ))}
            <button type="button" className="link-button" onClick={() => clearFilterKeys(FILTER_KEYS)}>Clear all</button>
          </div>
        )}

        <ListContent
          data={data}
          error={error}
          loading={loading}
          page={page}
          search={search}
          hasFilters={activeFilterCount > 0}
          onRetry={reload}
          onFirstPage={() => updateParams({ page: 1 })}
          onClearSearch={() => updateParams({ search: '', ...EMPTY_FILTERS, page: 1 })}
        >
          {data && (
            <>
              <ProfileTable
                profiles={pageProfiles}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                sort={sort}
                onSort={handleSort}
              />
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
      </section>

      {deleteTargets && (
        <ConfirmDialog
          title={deleteTargets.length === 1 ? `Delete ${fullName(deleteTargets[0])}?` : `Delete ${deleteTargets.length} profiles?`}
          message={deleteTargets.length === 1
            ? 'This also deletes their user account and cannot be undone.'
            : 'This also deletes their user accounts and cannot be undone.'}
          busy={busy === 'deleting'}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTargets(null)}
        />
      )}
      {filterOpen && <FilterDrawer filters={filters} onApply={applyFilters} onClose={() => setFilterOpen(false)} />}
    </div>
  )
}

/** Decides which state to show: loading, error, the two empty states, or the table. */
function ListContent({ data, error, loading, page, search, hasFilters, onRetry, onFirstPage, onClearSearch, children }) {
  // A 404 on the first page means there is nothing to list, so it gets the empty state below.
  const notFound = error?.status === 404
  if (error && !(notFound && page === 1)) {
    if (notFound) {
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

  if (loading && !data && !error) {
    return <LoadingState label="Loading profiles…" />
  }

  if (notFound || !Array.isArray(data?.results) || data.results.length === 0) {
    if (search || hasFilters) {
      return (
        <div className="state-box">
          <h2>{search ? `No profiles match “${search}”` : 'No profiles match these filters'}</h2>
          <p>Try a different search, or loosen the filters.</p>
          <button type="button" className="button" onClick={onClearSearch}>Clear search and filters</button>
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

  return <div className={`list-body${loading ? ' is-loading' : ''}`}>{children}</div>
}

import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'

import { fullName } from '../utils/profile'
import { ArrowDownIcon, ArrowUpIcon, MapPinIcon, SortIcon } from './Icons'
import ProfileImage from './ProfileImage'
import StatusBadge from './StatusBadge'

const COLUMNS = [
  { field: 'name', label: 'Name' },
  { field: 'username', label: 'Username' },
  { field: 'department', label: 'Department' },
  { field: 'job_title', label: 'Job title' },
  { field: 'city', label: 'City' },
  { field: 'is_active', label: 'Status' },
  { field: 'created_at', label: 'Created at' },
  { field: 'updated_at', label: 'Updated at' },
]

/**
 * The profiles table. Rows can be ticked; the toolbar above acts on `selectedIds`.
 * `sort` is { field, descending } or null (default order); clicking a header calls `onSort(field)`.
 */
export default function ProfileTable({ profiles, selectedIds, onSelectionChange, sort, onSort }) {
  // Remember this exact list view (page, search, sort, filters) so the profile's Back link returns to it.
  const { pathname, search } = useLocation()
  const from = pathname + search
  const pageIds = profiles.map((profile) => profile.id)
  const selectedOnPage = pageIds.filter((id) => selectedIds.includes(id))
  const allSelected = pageIds.length > 0 && selectedOnPage.length === pageIds.length
  const someSelected = selectedOnPage.length > 0 && !allSelected

  // "indeterminate" has no HTML attribute, so it has to be set on the element.
  const selectAllRef = useRef(null)
  useEffect(() => {
    selectAllRef.current.indeterminate = someSelected
  }, [someSelected])

  // The rows scroll inside the table box, so a new page should start at its first row.
  const wrapRef = useRef(null)
  useEffect(() => {
    wrapRef.current.scrollTop = 0
  }, [profiles])

  function toggle(id) {
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  // A click anywhere on a row ticks it, except on things with their own action
  // (the name link, the checkbox itself) or while the user is selecting text.
  function handleRowClick(event, id) {
    if (event.target.closest('a, button, input, label')) return
    if (window.getSelection()?.toString()) return
    toggle(id)
  }

  return (
    <div ref={wrapRef} className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th className="cell-check">
              <input
                ref={selectAllRef}
                type="checkbox"
                aria-label="Select all profiles on this page"
                checked={allSelected}
                onChange={() => onSelectionChange(allSelected ? [] : pageIds)}
              />
            </th>
            {COLUMNS.map((column) => (
              <SortableHeader key={column.field} column={column} sort={sort} onSort={onSort} />
            ))}
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => {
            const name = fullName(profile)
            const selected = selectedIds.includes(profile.id)
            return (
              <tr
                key={profile.id}
                className={`is-clickable${selected ? ' is-selected' : ''}`}
                onClick={(event) => handleRowClick(event, profile.id)}
              >
                <td className="cell-check">
                  <input
                    type="checkbox"
                    aria-label={`Select ${name}`}
                    checked={selected}
                    onChange={() => toggle(profile.id)}
                  />
                </td>
                <td>
                  <div className="person">
                    <ProfileImage src={profile.profile_image} name={name} size={40} />
                    <div className="person-text">
                      <Link to={`/profiles/${profile.id}`} state={{ from }} className="person-name">{name}</Link>
                      <span className="person-email">{profile.email}</span>
                    </div>
                  </div>
                </td>
                <td className="cell-nowrap">{profile.username}</td>
                <td>{profile.department ? <span className="tag">{profile.department}</span> : <span className="cell-muted">—</span>}</td>
                <td className="cell-nowrap">{profile.job_title || <span className="cell-muted">—</span>}</td>
                <td className="cell-nowrap">
                  {profile.city ? (
                    <span className="with-icon"><MapPinIcon size={14} />{profile.city}</span>
                  ) : (
                    <span className="cell-muted">—</span>
                  )}
                </td>
                <td>
                  <StatusBadge active={profile.is_active} />
                </td>
                <td><DateTimeCell value={profile.created_at} /></td>
                <td><DateTimeCell value={profile.updated_at} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SortableHeader({ column, sort, onSort }) {
  const active = sort?.field === column.field
  const direction = active ? (sort.descending ? 'descending' : 'ascending') : 'none'
  const ArrowIcon = !active ? SortIcon : sort.descending ? ArrowDownIcon : ArrowUpIcon
  const next = active && !sort.descending ? 'descending' : 'ascending'
  return (
    <th aria-sort={direction}>
      <button
        type="button"
        className={`sort-button${active ? ' is-active' : ''}`}
        onClick={() => onSort(column.field)}
        title={`Sort by ${column.label.toLowerCase()} (${next})`}
      >
        {column.label}
        <ArrowIcon size={14} />
      </button>
    </th>
  )
}

// Date on top, time underneath, in the viewer's timezone. The full value is in the tooltip.
function DateTimeCell({ value }) {
  if (!value) return <span className="cell-muted">—</span>
  const date = new Date(value)
  return (
    <time className="datetime" dateTime={value} title={date.toLocaleString()}>
      <span>{date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      <span className="datetime-time">{date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
    </time>
  )
}

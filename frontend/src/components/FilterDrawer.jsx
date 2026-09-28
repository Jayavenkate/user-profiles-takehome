import { useEffect, useRef, useState } from 'react'

import { listDepartments } from '../api/profiles'
import useFetch from '../hooks/useFetch'
import { EMPTY_FILTERS, validateFilters } from '../utils/filters'
import Select from './form/Select'
import { CloseIcon } from './Icons'

/**
 * Side panel for the list filters. Edits a draft copy and only calls onApply on submit,
 * so Cancel / Esc / clicking outside leave the list untouched.
 * The parent mounts it only while open, so the draft starts fresh each time.
 */
export default function FilterDrawer({ filters, onApply, onClose }) {
  const dialogRef = useRef(null)
  const [draft, setDraft] = useState(filters)
  const [errors, setErrors] = useState({})
  const departments = useFetch((signal) => listDepartments(signal), [])

  // showModal() gives us the backdrop, focus trapping and Esc-to-close for free.
  useEffect(() => {
    dialogRef.current.showModal()
  }, [])

  function update(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const found = validateFilters(draft)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }
    onApply(draft)
  }

  // A click on the dialog element itself (not its contents) is a click on the backdrop.
  function handleClick(event) {
    if (event.target === dialogRef.current) onClose()
  }

  // Keep a department from the URL selectable even if no profile has it any more.
  const departmentOptions = departments.data || []
  const showCurrentDepartment = draft.department && !departmentOptions.includes(draft.department)

  return (
    <dialog
      ref={dialogRef}
      className="drawer"
      aria-labelledby="filter-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={handleClick}
    >
      <form className="drawer-panel" onSubmit={handleSubmit} noValidate>
        <header className="drawer-header">
          <h2 id="filter-title">Profile Filter</h2>
          <button type="button" className="icon-button drawer-close" onClick={onClose} aria-label="Close filters">
            <CloseIcon size={20} />
          </button>
        </header>

        <div className="drawer-body">
          <div className="form-field">
            <label htmlFor="filter-department">Department</label>
            <Select
              id="filter-department"
              value={draft.department}
              placeholder="Select department"
              options={[
                ['', 'All departments'],
                ...(showCurrentDepartment ? [[draft.department, draft.department]] : []),
                ...departmentOptions.map((name) => [name, name]),
              ]}
              onChange={(value) => update('department', value)}
            />
            {departments.error && <p className="field-hint">Could not load the department list.</p>}
          </div>

          <fieldset className="drawer-group">
            <legend>Status</legend>
            <div className="segmented" role="radiogroup">
              {[['', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([value, label]) => (
                <label key={label} className={draft.status === value ? 'is-selected' : undefined}>
                  <input
                    type="radio"
                    name="status"
                    value={value}
                    checked={draft.status === value}
                    onChange={() => update('status', value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <DateRange
            legend="Created date"
            fromKey="created_from"
            toKey="created_to"
            draft={draft}
            errors={errors}
            onChange={update}
          />
          <DateRange
            legend="Updated date"
            fromKey="updated_from"
            toKey="updated_to"
            draft={draft}
            errors={errors}
            onChange={update}
          />

          <button
            type="button"
            className="button button-outline-primary drawer-reset"
            onClick={() => {
              setDraft(EMPTY_FILTERS)
              setErrors({})
            }}
          >
            Reset
          </button>
        </div>

        <footer className="drawer-footer">
          <button type="button" className="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button-primary">Apply filters</button>
        </footer>
      </form>
    </dialog>
  )
}

function DateRange({ legend, fromKey, toKey, draft, errors, onChange }) {
  return (
    <fieldset className="drawer-group">
      <legend>{legend}</legend>
      <div className="date-range">
        <div className={`form-field${errors[fromKey] ? ' has-error' : ''}`}>
          <label htmlFor={`filter-${fromKey}`}>From</label>
          <input
            id={`filter-${fromKey}`}
            type="date"
            value={draft[fromKey]}
            max={draft[toKey] || undefined}
            onChange={(event) => onChange(fromKey, event.target.value)}
          />
        </div>
        <div className={`form-field${errors[toKey] ? ' has-error' : ''}`}>
          <label htmlFor={`filter-${toKey}`}>To</label>
          <input
            id={`filter-${toKey}`}
            type="date"
            value={draft[toKey]}
            min={draft[fromKey] || undefined}
            aria-invalid={Boolean(errors[toKey])}
            aria-describedby={errors[toKey] ? `filter-${toKey}-error` : undefined}
            onChange={(event) => onChange(toKey, event.target.value)}
          />
        </div>
      </div>
      {errors[toKey] && <p id={`filter-${toKey}-error`} className="field-error">{errors[toKey]}</p>}
    </fieldset>
  )
}

// List filters live in the URL as simple values (dates as YYYY-MM-DD in the
// viewer's local time). These helpers convert them for display and for the API.

export const FILTER_KEYS = ['department', 'status', 'created_from', 'created_to', 'updated_from', 'updated_to']

export const EMPTY_FILTERS = Object.fromEntries(FILTER_KEYS.map((key) => [key, '']))

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function readFilters(searchParams) {
  const filters = { ...EMPTY_FILTERS }
  FILTER_KEYS.forEach((key) => {
    const value = (searchParams.get(key) || '').trim()
    if (key === 'status') filters.status = ['active', 'inactive'].includes(value) ? value : ''
    else if (key === 'department') filters.department = value
    else filters[key] = DATE_PATTERN.test(value) ? value : ''
  })
  return filters
}

export function countActiveFilters(filters) {
  return FILTER_KEYS.filter((key) => filters[key]).length
}

// "2026-09-28" -> the ISO instant of local midnight at the start of that day (or of the next day).
function localDayStart(value, addDays = 0) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day + addDays).toISOString()
}

/** URL filters -> API query params. "To" dates include the whole day, so they become the next local midnight. */
export function toApiParams(filters) {
  return {
    department: filters.department || undefined,
    is_active: filters.status ? String(filters.status === 'active') : undefined,
    created_after: filters.created_from ? localDayStart(filters.created_from) : undefined,
    created_before: filters.created_to ? localDayStart(filters.created_to, 1) : undefined,
    updated_after: filters.updated_from ? localDayStart(filters.updated_from) : undefined,
    updated_before: filters.updated_to ? localDayStart(filters.updated_to, 1) : undefined,
  }
}

/** Returns field errors, e.g. { created_to: '...' }, when a range ends before it starts. */
export function validateFilters(filters) {
  const errors = {}
  if (filters.created_from && filters.created_to && filters.created_to < filters.created_from) {
    errors.created_to = 'End date must be on or after the start date.'
  }
  if (filters.updated_from && filters.updated_to && filters.updated_to < filters.updated_from) {
    errors.updated_to = 'End date must be on or after the start date.'
  }
  return errors
}

// Short labels for the chips under the toolbar.
function formatDay(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function rangeLabel(from, to) {
  if (from && to) return `${formatDay(from)} – ${formatDay(to)}`
  if (from) return `from ${formatDay(from)}`
  return `until ${formatDay(to)}`
}

/** [{ label, keys }] — `keys` are the URL params a chip's × button clears. */
export function describeFilters(filters) {
  const chips = []
  if (filters.department) chips.push({ label: `Department: ${filters.department}`, keys: ['department'] })
  if (filters.status) chips.push({ label: `Status: ${filters.status === 'active' ? 'Active' : 'Inactive'}`, keys: ['status'] })
  if (filters.created_from || filters.created_to) {
    chips.push({ label: `Created ${rangeLabel(filters.created_from, filters.created_to)}`, keys: ['created_from', 'created_to'] })
  }
  if (filters.updated_from || filters.updated_to) {
    chips.push({ label: `Updated ${rangeLabel(filters.updated_from, filters.updated_to)}`, keys: ['updated_from', 'updated_to'] })
  }
  return chips
}

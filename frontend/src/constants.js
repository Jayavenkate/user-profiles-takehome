export const PAGE_SIZES = [5, 10, 25, 50]
export const DEFAULT_PAGE_SIZE = 10

// Table columns that can be sorted, in the ?ordering= format the API accepts.
export const SORT_FIELDS = ['name', 'username', 'department', 'job_title', 'city', 'is_active', 'created_at', 'updated_at']

// How long search waits after the last keystroke before it runs.
export const SEARCH_DEBOUNCE_MS = 350

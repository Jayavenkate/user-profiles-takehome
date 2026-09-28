import { useEffect, useRef, useState } from 'react'

import { SEARCH_DEBOUNCE_MS } from '../constants'
import { SearchIcon } from './Icons'

/**
 * Search input that searches as you type, once typing pauses. Enter searches straight away.
 * `value` is the search in the URL; when it changes from outside (back/forward, "Clear search"),
 * the input follows it.
 */
export default function SearchBar({ value, onSearch }) {
  const [term, setTerm] = useState(value)
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    if (value !== term.trim()) setTerm(value)
  }

  // The parent passes a new onSearch on every render; a ref keeps that from restarting the timer.
  const onSearchRef = useRef(onSearch)
  useEffect(() => {
    onSearchRef.current = onSearch
  })

  useEffect(() => {
    const trimmed = term.trim()
    if (trimmed === value) return undefined
    // replace: pauses while typing shouldn't each become a Back step.
    const timer = setTimeout(() => onSearchRef.current(trimmed, { replace: true }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [term, value])

  function handleSubmit(event) {
    event.preventDefault()
    const trimmed = term.trim()
    if (trimmed !== value) onSearch(trimmed)
  }

  function handleClear() {
    setTerm('')
    onSearch('')
  }

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit}>
      {value && (
        <button type="button" className="button button-ghost" onClick={handleClear}>Clear</button>
      )}
      <div className="search-input">
        <SearchIcon size={18} />
        <input
          type="search"
          placeholder="Search profiles…"
          aria-label="Search by name, username or email"
          title="Search by name, username or email"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
      </div>
      <button type="submit" className="visually-hidden">Search</button>
    </form>
  )
}

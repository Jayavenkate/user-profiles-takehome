import { useState } from 'react'

/**
 * Search input that submits on Enter / button click.
 * The parent renders it with key={value}, so it resets when the URL changes (back/forward).
 */
export default function SearchBar({ value, onSearch }) {
  const [term, setTerm] = useState(value)

  function handleSubmit(event) {
    event.preventDefault()
    onSearch(term.trim())
  }

  function handleClear() {
    setTerm('')
    onSearch('')
  }

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit}>
      <input
        type="search"
        placeholder="Search name, username or email"
        aria-label="Search profiles"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      <button type="submit" className="button">Search</button>
      {value && (
        <button type="button" className="button" onClick={handleClear}>Clear</button>
      )}
    </form>
  )
}

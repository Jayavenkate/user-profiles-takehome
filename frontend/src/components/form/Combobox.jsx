import { useId, useRef, useState } from 'react'

import { CheckIcon, ChevronDownIcon } from '../Icons'

/**
 * A text input with a suggestion list that looks and behaves like <Select>:
 * click (or the arrow) toggles the list, arrow keys / Home / End move, Enter picks,
 * Esc and Tab close. People can also type, which narrows the list, or enter a new value.
 * Extra props (id, name, aria-invalid, aria-describedby) come from FormField and go on the input.
 */
export default function Combobox({ value, options, onChange, placeholder, ...inputProps }) {
  const listId = useId()
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const query = value.trim().toLowerCase()
  // Show everything when the box is empty or already holds an exact suggestion.
  const exactIndex = options.findIndex((option) => option.toLowerCase() === query)
  const matches = !query || exactIndex >= 0 ? options : options.filter((option) => option.toLowerCase().includes(query))
  const showList = open && matches.length > 0

  // Like <Select>: opening highlights the current value, or the first option.
  function openList() {
    const current = matches.findIndex((option) => option.toLowerCase() === query)
    setActiveIndex(current >= 0 ? current : 0)
    setOpen(true)
  }

  function toggleList() {
    if (showList) setOpen(false)
    else openList()
  }

  function choose(option) {
    onChange(option)
    setOpen(false)
  }

  function handleKeyDown(event) {
    const last = matches.length - 1
    if (!showList) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
        event.preventDefault()
        openList()
      }
      return
    }
    if (event.key === 'ArrowDown') setActiveIndex((i) => Math.min(last, i + 1))
    else if (event.key === 'ArrowUp') setActiveIndex((i) => Math.max(0, i - 1))
    else if (event.key === 'Home') setActiveIndex(0)
    else if (event.key === 'End') setActiveIndex(last)
    // Enter picks the highlighted suggestion instead of submitting the form.
    else if (event.key === 'Enter') {
      if (activeIndex >= 0) choose(matches[activeIndex])
      else setOpen(false)
    } else if (event.key === 'Escape') setOpen(false)
    else if (event.key === 'Tab') {
      setOpen(false)
      return
    } else return
    event.preventDefault()
  }

  return (
    <div className={`select${showList ? ' is-open' : ''}`}>
      <div className="select-trigger combobox-field">
        <input
          {...inputProps}
          ref={inputRef}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
            setActiveIndex(0)
          }}
          onBlur={() => setOpen(false)}
          onClick={toggleList}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="combobox-toggle"
          tabIndex={-1}
          aria-label={showList ? 'Hide suggestions' : 'Show suggestions'}
          // Keep focus in the input so the list stays tied to it.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            inputRef.current.focus()
            toggleList()
          }}
        >
          <ChevronDownIcon size={18} />
        </button>
      </div>

      {showList && (
        <ul id={listId} role="listbox" className="select-menu">
          {matches.map((option, index) => {
            const selected = option.toLowerCase() === query
            return (
              <li
                key={option}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={selected}
                className={`select-option${index === activeIndex ? ' is-active' : ''}`}
                // Keep focus in the input while clicking.
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option)}
              >
                {option}
                {selected && <CheckIcon size={16} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

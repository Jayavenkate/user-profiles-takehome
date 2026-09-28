import { useEffect, useId, useRef, useState } from 'react'

import { CheckIcon, ChevronDownIcon } from '../Icons'

/**
 * A select with a styled pop-up list (a native <select> popup can't be styled).
 * Follows the "select-only combobox" pattern: focus stays on the button and
 * aria-activedescendant points at the highlighted option.
 *
 * `options` is [[value, label], ...]. An empty value always shows the placeholder, even if an
 * option has value '' (e.g. "All departments", kept in the list as a way to clear the choice).
 * Extra props (id, aria-invalid, aria-describedby)
 * come from FormField and go on the button, so labels and error focus work as usual.
 */
export default function Select({ value, options, placeholder = 'Select…', onChange, ...buttonProps }) {
  const listId = useId()
  const wrapRef = useRef(null)
  const [open, setOpen] = useState(false)
  const selectedIndex = options.findIndex(([optionValue]) => optionValue === value)
  const [activeIndex, setActiveIndex] = useState(-1)

  // Close when clicking anywhere outside.
  useEffect(() => {
    if (!open) return undefined
    function handlePointerDown(event) {
      if (!wrapRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  function openList() {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  function choose(index) {
    onChange(options[index][0])
    setOpen(false)
  }

  function handleKeyDown(event) {
    const last = options.length - 1
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        openList()
      }
      return
    }
    if (event.key === 'ArrowDown') setActiveIndex((i) => Math.min(last, i + 1))
    else if (event.key === 'ArrowUp') setActiveIndex((i) => Math.max(0, i - 1))
    else if (event.key === 'Home') setActiveIndex(0)
    else if (event.key === 'End') setActiveIndex(last)
    else if (event.key === 'Enter' || event.key === ' ') choose(activeIndex)
    else if (event.key === 'Escape') setOpen(false)
    else if (event.key === 'Tab') {
      setOpen(false)
      return
    } else return
    event.preventDefault()
  }

  const selectedLabel = value !== '' && selectedIndex >= 0 ? options[selectedIndex][1] : null

  return (
    <div ref={wrapRef} className={`select${open ? ' is-open' : ''}`}>
      <button
        {...buttonProps}
        type="button"
        role="combobox"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
      >
        <span className={selectedLabel ? undefined : 'select-placeholder'}>{selectedLabel || placeholder}</span>
        <ChevronDownIcon size={18} />
      </button>

      {open && (
        <ul id={listId} role="listbox" className="select-menu">
          {options.map(([optionValue, label], index) => (
            <li
              key={optionValue}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={optionValue === value}
              className={`select-option${index === activeIndex ? ' is-active' : ''}`}
              // Keep focus on the button while clicking.
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(index)}
            >
              {label}
              {optionValue === value && <CheckIcon size={16} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

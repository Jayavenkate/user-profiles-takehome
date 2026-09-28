/**
 * Label + control + error message, wired together for screen readers.
 * `children` receives the props the input needs ({ id, name, aria-* }).
 */
export default function FormField({ label, name, error, required = false, hint, className = '', children }) {
  const id = `field-${name}`
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

  return (
    <div className={`form-field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="required" aria-hidden="true"> *</span>}
      </label>
      {children({ id, name, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  )
}

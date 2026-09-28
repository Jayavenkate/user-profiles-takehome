import { useId } from 'react'

/**
 * One section of the profile form: title and description on the left, fields on the right.
 * Sections sit inside one panel, separated by lines. `grid={false}` renders the children as-is.
 */
export default function FormSection({ icon, title, description, grid = true, children }) {
  const titleId = useId()
  return (
    <section className="form-section" role="group" aria-labelledby={titleId}>
      <header className="form-section-header">
        <span className="form-section-icon" aria-hidden="true">{icon}</span>
        <div>
          <h2 id={titleId}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </header>
      <div className="form-section-body">
        {grid ? <div className="form-grid">{children}</div> : children}
      </div>
    </section>
  )
}

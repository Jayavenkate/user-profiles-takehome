/** Spinning ring that inherits the text colour. Pass `label` to show text next to it. */
export default function Spinner({ size = 16, label }) {
  return (
    <span className="spinner-wrap" role={label ? 'status' : undefined}>
      <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  )
}

/** Full-width loading state for pages and panels. */
export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="state-box state-box-loading" role="status" aria-live="polite">
      <span className="spinner spinner-lg" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

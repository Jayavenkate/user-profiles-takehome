export default function StatusBadge({ active }) {
  return (
    <span className={`badge ${active ? 'badge-active' : 'badge-inactive'}`}>
      <span className="badge-dot" aria-hidden="true" />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export default function StatusBadge({ active }) {
  return <span className={`badge ${active ? 'badge-active' : 'badge-inactive'}`}>{active ? 'Active' : 'Inactive'}</span>
}

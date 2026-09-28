import { Link, Outlet } from 'react-router'

export default function Layout() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="brand">User Profiles</Link>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

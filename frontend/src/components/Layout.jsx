import { Link, NavLink, Outlet, useLocation } from 'react-router'

import { PlusIcon, UsersIcon } from './Icons'
import ToastProvider from './Toast'

const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export default function Layout() {
  const { pathname } = useLocation()
  // "Profiles" stays highlighted on detail and edit pages; only the create page belongs to "New profile".
  const onCreatePage = pathname === '/profiles/new'

  return (
    <ToastProvider>
      <div className="app">
        <aside className="sidebar">
          <Link to="/" className="brand">
            <span className="brand-mark"><UsersIcon size={22} /></span>
            <span>
              <span className="brand-name">User Profiles</span>
              <span className="brand-tagline">Team directory</span>
            </span>
          </Link>
          <nav className="sidebar-nav" aria-label="Main">
            <NavLink to="/" className={() => `sidebar-link${onCreatePage ? '' : ' active'}`}>
              <UsersIcon size={20} />
              Profiles
            </NavLink>
            <NavLink to="/profiles/new" className="sidebar-link">
              <PlusIcon size={20} />
              New profile
            </NavLink>
          </nav>
        </aside>
        <div className="app-body">
          <header className="topbar">
            <span className="topbar-title">Team Directory</span>
            <span className="topbar-date">{today}</span>
          </header>
          <main className="app-main">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}

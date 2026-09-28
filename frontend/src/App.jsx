import { BrowserRouter, Route, Routes } from 'react-router'

import Layout from './components/Layout'
import NotFoundPage from './pages/NotFoundPage'
import ProfileCreatePage from './pages/ProfileCreatePage'
import ProfileDetailPage from './pages/ProfileDetailPage'
import ProfileEditPage from './pages/ProfileEditPage'
import ProfileListPage from './pages/ProfileListPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ProfileListPage />} />
          <Route path="profiles/new" element={<ProfileCreatePage />} />
          <Route path="profiles/:id" element={<ProfileDetailPage />} />
          <Route path="profiles/:id/edit" element={<ProfileEditPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

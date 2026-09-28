import { Link, useNavigate } from 'react-router'

import { createProfile } from '../api/profiles'
import ProfileForm from '../components/form/ProfileForm'

export default function ProfileCreatePage() {
  const navigate = useNavigate()

  async function handleSubmit(formData) {
    const profile = await createProfile(formData)
    navigate(`/profiles/${profile.id}`, { state: { message: 'Profile created.' } })
  }

  return (
    <>
      <p className="breadcrumb">
        <Link to="/">← All profiles</Link>
      </p>
      <div className="page-header">
        <h1>New profile</h1>
      </div>
      <ProfileForm submitLabel="Create profile" cancelTo="/" onSubmit={handleSubmit} />
    </>
  )
}

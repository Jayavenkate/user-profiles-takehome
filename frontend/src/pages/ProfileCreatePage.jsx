import { Link, useNavigate } from 'react-router'

import { createProfile } from '../api/profiles'
import ProfileForm from '../components/form/ProfileForm'
import { ArrowLeftIcon } from '../components/Icons'
import useToast from '../hooks/useToast'
import { fullName } from '../utils/profile'

export default function ProfileCreatePage() {
  const navigate = useNavigate()
  const showToast = useToast()

  async function handleSubmit(formData) {
    const profile = await createProfile(formData)
    showToast(`${fullName(profile)} was added.`)
    navigate('/')
  }

  return (
    <>
      <Link to="/" className="back-link">
        <ArrowLeftIcon size={18} />
        Back to profiles
      </Link>

      <div className="page-header">
        <div>
          <h1>New profile</h1>
          <p className="page-subtitle">Add a team member to the directory.</p>
        </div>
      </div>
      <ProfileForm submitLabel="Create profile" cancelTo="/" onSubmit={handleSubmit} />
    </>
  )
}

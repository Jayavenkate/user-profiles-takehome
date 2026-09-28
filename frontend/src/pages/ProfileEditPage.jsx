import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { getProfile, updateProfile } from '../api/profiles'
import ProfileForm from '../components/form/ProfileForm'
import { ArrowLeftIcon } from '../components/Icons'
import useToast from '../hooks/useToast'
import useFetch from '../hooks/useFetch'
import { LoadingState } from '../components/Spinner'
import { fullName } from '../utils/profile'
import NotFoundPage from './NotFoundPage'

export default function ProfileEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const showToast = useToast()
  const { data: profile, error, loading, reload } = useFetch((signal) => getProfile(id, signal), [id])

  if (error?.status === 404) {
    return <NotFoundPage title="Profile not found" message={`There is no profile with id “${id}” to edit.`} />
  }
  if (error) {
    return (
      <div className="state-box" role="alert">
        <h2>Could not load this profile</h2>
        <p>{error.message}</p>
        <button type="button" className="button" onClick={reload}>Try again</button>
      </div>
    )
  }
  if (loading || !profile) {
    return <LoadingState label="Loading profile…" />
  }

  async function handleSubmit(formData) {
    await updateProfile(profile.id, formData)
    // Keep `from` so the profile's Back link still returns to the list view the user came from.
    showToast('Changes saved.')
    navigate(`/profiles/${profile.id}`, { state: { from: location.state?.from } })
  }

  return (
    <>
      {/* Pass `from` along so the profile's own Back link still returns to the right list view. */}
      <Link to={`/profiles/${profile.id}`} state={{ from: location.state?.from }} className="back-link">
        <ArrowLeftIcon size={18} />
        Back to profile
      </Link>

      <div className="page-header">
        <div>
          <h1>Edit {fullName(profile)}</h1>
          <p className="page-subtitle">Update their details. Changes are saved when you click Save changes.</p>
        </div>
      </div>
      {/* key: start with fresh form state if the id changes */}
      <ProfileForm key={profile.id} profile={profile} submitLabel="Save changes" cancelTo={`/profiles/${profile.id}`} onSubmit={handleSubmit} />
    </>
  )
}

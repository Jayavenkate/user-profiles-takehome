import { Link, useNavigate, useParams } from 'react-router'

import { getProfile, updateProfile } from '../api/profiles'
import ProfileForm from '../components/form/ProfileForm'
import useFetch from '../hooks/useFetch'
import { fullName } from '../utils/profile'
import NotFoundPage from './NotFoundPage'

export default function ProfileEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
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
    return <div className="state-box">Loading profile…</div>
  }

  async function handleSubmit(formData) {
    await updateProfile(profile.id, formData)
    navigate(`/profiles/${profile.id}`, { state: { message: 'Changes saved.' } })
  }

  return (
    <>
      <p className="breadcrumb">
        <Link to={`/profiles/${profile.id}`}>← Back to {fullName(profile)}</Link>
      </p>
      <div className="page-header">
        <h1>Edit {fullName(profile)}</h1>
      </div>
      {/* key: start with fresh form state if the id changes */}
      <ProfileForm key={profile.id} profile={profile} submitLabel="Save changes" cancelTo={`/profiles/${profile.id}`} onSubmit={handleSubmit} />
    </>
  )
}

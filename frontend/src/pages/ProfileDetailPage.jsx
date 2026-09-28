import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { getProfile } from '../api/profiles'
import DeleteProfileButton from '../components/DeleteProfileButton'
import ProfileImage from '../components/ProfileImage'
import StatusBadge from '../components/StatusBadge'
import useFetch from '../hooks/useFetch'
import useFlashMessage from '../hooks/useFlashMessage'
import { capitalize, formatDate, formatDateTime, fullName } from '../utils/profile'
import NotFoundPage from './NotFoundPage'

export default function ProfileDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useFlashMessage()
  const [deleteError, setDeleteError] = useState(null)

  const { data: profile, error, loading, reload } = useFetch((signal) => getProfile(id, signal), [id])

  if (error?.status === 404) {
    return <NotFoundPage title="Profile not found" message={`There is no profile with id “${id}”. It may have been deleted.`} />
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

  const name = fullName(profile)
  const fields = [
    ['Username', profile.username],
    ['Email', profile.email],
    ['Phone', profile.phone || '—'],
    ['Gender', capitalize(profile.gender)],
    ['Date of birth', formatDate(profile.date_of_birth)],
    ['Job title', profile.job_title],
    ['Department', profile.department],
    ['City', profile.city],
    ['Country', profile.country],
    ['Hire date', formatDate(profile.hire_date)],
    ['Created', formatDateTime(profile.created_at)],
    ['Last updated', formatDateTime(profile.updated_at)],
  ]

  return (
    <>
      <p className="breadcrumb">
        <Link to="/">← All profiles</Link>
      </p>

      {message && (
        <div className="alert alert-success" role="status">
          {message}
          <button type="button" className="link-button" onClick={() => setMessage(null)}>Dismiss</button>
        </div>
      )}
      {deleteError && <div className="alert alert-error" role="alert">{deleteError}</div>}

      <div className="card detail">
        <div className="detail-header">
          <ProfileImage src={profile.profile_image} name={name} size={112} />
          <div className="detail-title">
            <h1>{name}</h1>
            <p className="muted">{profile.job_title} · {profile.department}</p>
            <StatusBadge active={profile.is_active} />
          </div>
          <div className="header-actions">
            <Link to={`/profiles/${profile.id}/edit`} className="button button-primary">Edit</Link>
            <DeleteProfileButton
              profile={profile}
              onDeleted={() => navigate('/', { state: { message: `${name} was deleted.` } })}
              onError={setDeleteError}
            />
          </div>
        </div>

        <dl className="detail-fields">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <h2>Bio</h2>
        <p className="detail-bio">{profile.bio || <span className="muted">No bio yet.</span>}</p>
      </div>
    </>
  )
}

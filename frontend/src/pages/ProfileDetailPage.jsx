import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { getProfile } from '../api/profiles'
import DeleteProfileButton from '../components/DeleteProfileButton'
import { ArrowLeftIcon } from '../components/Icons'
import ProfileImage from '../components/ProfileImage'
import StatusBadge from '../components/StatusBadge'
import useToast from '../hooks/useToast'
import useFetch from '../hooks/useFetch'
import { LoadingState } from '../components/Spinner'
import { capitalize, formatDate, formatDateTime, fullName } from '../utils/profile'
import NotFoundPage from './NotFoundPage'

export default function ProfileDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  // The list view we came from (page, search, filters), or the plain list for direct visits.
  const from = typeof location.state?.from === 'string' && location.state.from.startsWith('/') ? location.state.from : '/'
  const showToast = useToast()

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
    return <LoadingState label="Loading profile…" />
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
      <Link to={from} className="back-link">
        <ArrowLeftIcon size={18} />
        Back to profiles
      </Link>

      <div className="card detail">
        <div className="detail-header">
          <ProfileImage src={profile.profile_image} name={name} size={112} />
          <div className="detail-title">
            <h1>{name}</h1>
            <p className="muted">{profile.job_title} · {profile.department}</p>
            <StatusBadge active={profile.is_active} />
          </div>
          <div className="header-actions">
            <Link to={`/profiles/${profile.id}/edit`} state={{ from }} className="button button-primary">Edit</Link>
            <DeleteProfileButton
              profile={profile}
              onDeleted={() => {
                showToast(`${name} was deleted.`)
                navigate(from)
              }}
              onError={(message) => showToast(message, { tone: 'error' })}
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

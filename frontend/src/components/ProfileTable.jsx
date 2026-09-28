import { Link } from 'react-router'

import { fullName } from '../utils/profile'
import DeleteProfileButton from './DeleteProfileButton'
import ProfileImage from './ProfileImage'
import StatusBadge from './StatusBadge'

export default function ProfileTable({ profiles, onDeleted, onDeleteError }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th aria-label="Image" />
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Department</th>
            <th>Job title</th>
            <th>City</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id}>
              <td>
                <ProfileImage src={profile.profile_image} name={fullName(profile)} size={36} />
              </td>
              <td>
                <Link to={`/profiles/${profile.id}`}>{fullName(profile)}</Link>
              </td>
              <td className="cell-nowrap">{profile.username}</td>
              <td className="cell-nowrap">{profile.email}</td>
              <td>{profile.department}</td>
              <td>{profile.job_title}</td>
              <td>{profile.city}</td>
              <td>
                <StatusBadge active={profile.is_active} />
              </td>
              <td>
                <div className="row-actions">
                  <Link to={`/profiles/${profile.id}/edit`} className="button button-small">Edit</Link>
                  <DeleteProfileButton
                    profile={profile}
                    className="button-small"
                    onDeleted={onDeleted}
                    onError={onDeleteError}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

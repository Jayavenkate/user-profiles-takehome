import { useState } from 'react'

import { UserIcon } from './Icons'

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// Each person gets a stable colour from their name, so initials avatars are easy to tell apart.
const AVATAR_COLORS = [
  ['#e0e7ff', '#3730a3'],
  ['#dbeafe', '#1e40af'],
  ['#d1fae5', '#065f46'],
  ['#fef3c7', '#92400e'],
  ['#fce7f3', '#9d174d'],
  ['#ede9fe', '#5b21b6'],
  ['#ccfbf1', '#115e59'],
  ['#ffe4e6', '#9f1239'],
]

function avatarColor(name) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

/** Shows the profile image, or the person's initials when there is no image or it fails to load. */
export default function ProfileImage({ src, name = '', size = 40 }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const showImage = src && failedSrc !== src
  const style = { width: size, height: size, fontSize: size * 0.4 }

  if (showImage) {
    return (
      <img
        className="profile-image"
        src={src}
        alt={name}
        style={style}
        onError={() => setFailedSrc(src)}
      />
    )
  }
  const [background, color] = avatarColor(name)
  return (
    <span className="profile-image profile-image-placeholder" style={{ ...style, background, color }} role="img" aria-label={`${name || 'No'} image`}>
      {initials(name) || <UserIcon size={Math.round(size * 0.45)} />}
    </span>
  )
}

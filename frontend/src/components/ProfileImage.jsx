import { useState } from 'react'

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
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
  return (
    <span className="profile-image profile-image-placeholder" style={style} role="img" aria-label={`${name || 'No'} image`}>
      {initials(name) || '?'}
    </span>
  )
}

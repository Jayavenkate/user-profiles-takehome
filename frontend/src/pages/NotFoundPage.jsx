import { Link } from 'react-router'

export default function NotFoundPage({ title = 'Page not found', message = "The page you're looking for doesn't exist." }) {
  return (
    <div className="state-box">
      <h1>{title}</h1>
      <p>{message}</p>
      <Link to="/" className="button">Back to profiles</Link>
    </div>
  )
}

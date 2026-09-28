import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

/**
 * Reads a one-time message passed with navigate(to, { state: { message } }),
 * then clears it from history so a refresh doesn't show it again.
 */
export default function useFlashMessage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [message, setMessage] = useState(location.state?.message || null)

  useEffect(() => {
    if (location.state?.message) {
      navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null })
    }
  }, [location, navigate])

  return [message, setMessage]
}

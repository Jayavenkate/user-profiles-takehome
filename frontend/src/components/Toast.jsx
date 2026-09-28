import { useCallback, useEffect, useRef, useState } from 'react'

import { ToastContext } from '../hooks/useToast'
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon, WarningIcon } from './Icons'

const TONES = {
  success: { icon: CheckIcon, duration: 5000 },
  info: { icon: InfoIcon, duration: 5000 },
  warning: { icon: WarningIcon, duration: 6000 },
  // Errors stay up longer so there is time to read them.
  error: { icon: AlertIcon, duration: 7000 },
}

/** Holds the toast list and renders it above every page. */
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => setToasts((list) => list.filter((toast) => toast.id !== id)), [])
  const showToast = useCallback((message, { tone = 'success' } = {}) => {
    const id = ++nextId.current
    setToasts((list) => [...list, { id, message, tone }])
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} tone={toast.tone} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ message, tone, onDismiss }) {
  const { icon: ToneIcon, duration } = TONES[tone] || TONES.success
  // Keep the latest callback without restarting the timer on every render.
  const onDismissRef = useRef(onDismiss)
  useEffect(() => {
    onDismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    const timer = setTimeout(() => onDismissRef.current(), duration)
    return () => clearTimeout(timer)
  }, [duration])

  return (
    <div className={`toast toast-${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <span className="toast-icon"><ToneIcon size={16} /></span>
      <span className="toast-message">{message}</span>
      <button type="button" className="icon-button toast-close" onClick={onDismiss} aria-label="Dismiss">
        <CloseIcon size={16} />
      </button>
    </div>
  )
}

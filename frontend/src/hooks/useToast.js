import { createContext, useContext } from 'react'

// Outside a ToastProvider the toast would silently vanish, so say so in the console.
export const ToastContext = createContext((message) => console.warn('showToast called outside <ToastProvider>:', message))

/**
 * Returns `showToast(message, { tone })`, which pops a message in the top-right corner.
 * `tone` is 'success' (default), 'info', 'warning' or 'error'.
 */
export default function useToast() {
  return useContext(ToastContext)
}

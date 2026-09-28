import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// The splash in index.html stays up for at least this long (counted from page load),
// so a fast load doesn't flash it on and off.
const MIN_SPLASH_MS = 400
// Don't hold the app back forever if the web font is slow or blocked.
const MAX_FONT_WAIT_MS = 1500

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

function hideSplash() {
  const splash = document.getElementById('app-loader')
  if (!splash) return
  splash.classList.add('is-hidden')
  splash.addEventListener('transitionend', () => splash.remove(), { once: true })
  // Fallback when there is no transition (e.g. the tab is in the background).
  setTimeout(() => splash.remove(), 500)
}

// Wait for the web font too, so text doesn't visibly change font right after the splash.
const fontsReady = document.fonts?.ready ?? Promise.resolve()
const minTime = new Promise((resolve) => setTimeout(resolve, Math.max(0, MIN_SPLASH_MS - performance.now())))
const fontTimeout = new Promise((resolve) => setTimeout(resolve, MAX_FONT_WAIT_MS))

Promise.all([minTime, Promise.race([fontsReady, fontTimeout])]).then(() => requestAnimationFrame(hideSplash))

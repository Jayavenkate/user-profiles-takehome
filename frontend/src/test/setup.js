import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// jsdom has <dialog> but not its modal methods yet.
HTMLDialogElement.prototype.showModal ??= function showModal() {
  this.open = true
}
HTMLDialogElement.prototype.close ??= function close() {
  this.open = false
}

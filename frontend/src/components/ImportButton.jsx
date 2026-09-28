import { useRef, useState } from 'react'

import { importProfiles } from '../api/profiles'
import { UploadIcon } from './Icons'
import Spinner from './Spinner'

/** Opens a file picker and uploads the chosen JSON file. The page shows the result. */
export default function ImportButton({ onImported, onError }) {
  const inputRef = useRef(null)
  const [importing, setImporting] = useState(false)

  async function handleFileChange(event) {
    const file = event.target.files[0]
    // Reset so choosing the same file again still triggers onChange.
    event.target.value = ''
    if (!file) return

    setImporting(true)
    try {
      onImported(await importProfiles(file))
    } catch (error) {
      onError(error.data?.file?.[0] || error.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".json,application/json" hidden onChange={handleFileChange} />
      <button type="button" className="button" disabled={importing} onClick={() => inputRef.current.click()}>
        {importing ? <Spinner /> : <UploadIcon />}
        {importing ? 'Importing…' : 'Import JSON'}
      </button>
    </>
  )
}

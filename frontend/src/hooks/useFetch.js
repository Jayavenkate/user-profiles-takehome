import { useCallback, useEffect, useState } from 'react'

/**
 * Runs `fetcher(signal)` whenever `deps` change and tracks loading / error / data.
 * The previous request is aborted, so a slow old response can't overwrite a newer one.
 * Old data is kept while reloading, so tables don't flash empty between pages.
 */
export default function useFetch(fetcher, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState((prev) => ({ ...prev, loading: true, error: null }))

    fetcher(controller.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ data: null, error, loading: false })
      })

    return () => controller.abort()
    // `fetcher` is usually an inline function; `deps` decide when to refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { ...state, reload }
}

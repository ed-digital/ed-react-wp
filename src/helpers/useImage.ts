import * as React from 'react'
import { usePageLoadPromise } from './usePageLoader'

type ImageReadyState = 'loading' | 'error' | 'ready'

function hasImageLoaded(img: HTMLImageElement | null) {
  return img && img.complete
}

export function useImage(ref: React.RefObject<HTMLImageElement>): ImageReadyState {
  const [readyState, setLoadState] = React.useState<ImageReadyState>(
    hasImageLoaded(ref.current) ? 'ready' : 'loading'
  )

  const finishedLoading = usePageLoadPromise()
  React.useEffect(() => {
    let canceled = false
    const img = ref.current
    if (!img) return
    img.onerror = () => {
      if (canceled) return
      setLoadState('error')
      finishedLoading()
    }

    img.onload = () => {
      if (canceled) return
      setLoadState('ready')
      finishedLoading()
    }

    if (hasImageLoaded(img) && readyState === 'loading') {
      if (canceled) return
      setLoadState('ready')
      finishedLoading()
    }
    return () => {
      canceled = true
    }
  }, [ref.current])

  return readyState
}

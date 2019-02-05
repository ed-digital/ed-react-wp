import * as React from 'react'
import { usePageLoadPromise } from './usePageLoader'

type ImageReadyState = 'loading' | 'error' | 'ready'

type Image = {
  src: string
  readyState: ImageReadyState
  width: number
  height: number
  duration: number
}

const preloadedImages: { [index: string]: HTMLImageElement } = {}

export function useImage(src: string): Image {
  const startTime = Date.now()
  const img = React.useMemo(() => (preloadedImages[src] ? preloadedImages[src] : new Image()), [
    src
  ])
  const [readyState, setLoadState] = React.useState<ImageReadyState>(
    preloadedImages[src] ? 'ready' : 'loading'
  )
  const [endTime, setEndTime] = React.useState(0)
  const finishedLoading = usePageLoadPromise()
  React.useEffect(() => {
    let canceled = false
    img.src = src
    img.onerror = () => {
      if (canceled) return
      setLoadState('error')
      finishedLoading()
      preloadedImages[src] = img
    }
    img.onload = () => {
      if (canceled) return
      setLoadState('ready')
      setEndTime(Date.now())
      finishedLoading()
      preloadedImages[src] = img
    }

    if (img.complete && !endTime) {
      if (canceled) return
      setLoadState('ready')
      setEndTime(Date.now())
      finishedLoading()
      preloadedImages[src] = img
    }
    return () => {
      canceled = true
    }
  }, [src])

  let width = 0
  let height = 0
  if (readyState === 'ready') {
    width = img.naturalWidth || img.width
    height = img.naturalHeight || img.height
  }

  return {
    src,
    readyState,
    width,
    height,
    duration: endTime - startTime
  }
}

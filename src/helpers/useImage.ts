import * as React from 'react'
import { usePageLoadPromise } from './usePageLoader'
import { on } from '@_ed/wp'

type ImageReadyState = 'loading' | 'error' | 'ready'

function hasImageLoaded(img: HTMLImageElement | null) {
  return img && img.complete
}

/* [[], []] is too gross */
const events: { [name: string]: ImageReadyState } = { error: 'error', load: 'ready' }
const states = Object.entries(events)

export function useImage(ref: React.RefObject<HTMLImageElement>): ImageReadyState {
  const [readyState, setLoadState] = React.useState<ImageReadyState>(
    hasImageLoaded(ref.current) ? 'ready' : 'loading'
  )

  /* Hook into page loading */
  const finishedLoading = usePageLoadPromise()

  React.useEffect(() => {
    const img = ref.current
    if (!img) return

    /* Returns a disposer function for each event:state */

    const onEvents = caller(states.map(([event, state]) => on(img, event, () => update(state))))

    /* 
      Function to call when complete. 
      It will unhook events so it doesn't get called a second time. 
    */
    const update = (state: ImageReadyState) => {
      setLoadState(state)
      finishedLoading()
      onEvents()
    }

    /* Image is already ready! Should we check this before we hook events? */
    if (hasImageLoaded(img) && readyState === 'loading') update('ready')

    // Disposer function
    return onEvents
  }, [ref.current])

  return readyState
}

// Used to keep everything functional you know what I'm saying
function caller(arr: (() => any)[]) {
  return () => arr.map(fn => fn())
}

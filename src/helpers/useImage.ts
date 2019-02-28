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

export function useImage(ref: React.RefObject<HTMLImageElement>, log = false): ImageReadyState {
  const intialState = hasImageLoaded(ref.current) ? 'ready' : 'loading'
  const [readyState, setLoadState] = React.useState<ImageReadyState>(intialState)

  /* Hook into page loading */
  const finishedLoading = usePageLoadPromise()

  if (log) console.log('Ran with ref', ref)

  React.useEffect(() => {
    const img = ref.current
    if (log) console.log('Ran with img', img)
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

    if (log) console.log('img', img, 'readyState', readyState)

    // Disposer function
    return onEvents
  }, [ref && ref.current && ref.current.src])

  return readyState
}

// Used to keep everything functional you know what I'm saying
function caller(arr: (() => any)[]) {
  return () => arr.forEach(fn => fn())
}

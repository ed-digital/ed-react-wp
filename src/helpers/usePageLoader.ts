import * as React from 'react'
import { useRoute } from '../routing/context'
import { Route } from '../routing/types'

type PageLoaderConfig = {
  maxTime: number | ((...arg: any[]) => number)
  minTime: number | ((...arg: any[]) => number)
}

type PageLoader = PageLoaderConfig & {
  startTime: number
  isFirstLoad: boolean
  complete: boolean
  progress: number
  promises: {
    promise: Promise<any>
    done: boolean
  }[]
  addPromise: (promise: Promise<any>) => void
}

const state: { loader?: PageLoader; lastRoute?: Route } = {
  lastRoute: undefined,
  loader: undefined
}

export function usePageLoaderConf({ minTime, maxTime }: PageLoaderConfig) {
  const loader = usePageLoader()
  const minTimeVal = typeof minTime == 'function' ? minTime(loader) : minTime
  const maxTimeVal = typeof maxTime == 'function' ? maxTime(loader) : maxTime

  if (loader.minTime === 0 && minTimeVal > 0) {
    loader.addPromise(new Promise(resolve => setTimeout(resolve, minTimeVal)))
  }
  if (loader.maxTime === 0) {
    loader.addPromise(
      new Promise(resolve => setTimeout(() => resolve('END_LOADER'), Number(maxTimeVal) || 1000))
    )
  }
  loader.minTime = minTimeVal
  loader.maxTime = maxTimeVal
  return loader
}

export function usePageLoader(): PageLoader {
  const route = useRoute()
  const [progress, setProgress] = React.useState(0)

  if (!state.loader || route !== state.lastRoute) {
    const checkProgress = () => {
      /* We are seriously hoping the loader doesnt change */
      if (state.loader !== loader) return
      /* Return the percentage of promises complete */
      const progress = loader.complete
        ? 1
        : loader.promises.filter(item => item.done).length / (loader.promises.length - 1)
      /*  */
      loader.progress = progress
      if (progress === 1) {
        loader.promises = []
      }

      /*  */
      setProgress(progress)
    }
    const loader: PageLoader = {
      isFirstLoad: state.lastRoute === undefined,
      startTime: Date.now(),
      maxTime: 0,
      minTime: 0,
      promises: [],
      complete: false,
      progress: 0,
      addPromise: (promise: Promise<any>) => {
        const item = {
          promise,
          done: false
        }
        loader.promises.push(item)
        promise
          .then(val => {
            if (val === 'END_LOADER') {
              loader.complete = true
            }
            item.done = true
            checkProgress()
          })
          .catch(() => {
            item.done = true
            checkProgress()
          })
        checkProgress()
      }
    }
    state.loader = loader
    state.lastRoute = route
    // @ts-ignore
    window.loader = loader
  }
  return state.loader
}

export function usePageLoadPromise(key?: string): Function {
  const loader = usePageLoader()
  const { promise, resolve } = React.useMemo(() => {
    let resolve: Function
    let done = false
    const promise = new Promise(_resolve => {
      if (done) return _resolve()
      resolve = _resolve
    })
    return {
      promise,
      resolve: () => {
        done = true
        if (resolve) resolve()
      }
    }
  }, [])
  React.useEffect(() => {
    // console.log('Adding promise', promise, loader)
    loader.addPromise(promise)
  }, [])
  return resolve
}

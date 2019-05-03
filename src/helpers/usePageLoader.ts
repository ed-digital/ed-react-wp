import * as React from 'react'
import { useRoute } from '../routing/context'
import { Route } from '../routing/types'
import Reactive from '../util/reactive/reactive'

type PageLoaderConfig = {
  maxTime: number | ((...arg: any[]) => number)
  minTime: number | ((...arg: any[]) => number)
}

type PageLoader = PageLoaderConfig & {
  startTime: number
  isFirstLoad: boolean
  complete: boolean
  progress: number
  completed: number
  count: number
  addPromise: (promise: Promise<any>, ref: any) => void
}

function wait<T = any>(
  time: number
): { finally: (...arg: any[]) => any; cancel: (...arg: any[]) => any } & Promise<T> & any {
  let resolver
  let tm: any

  const promise = new Promise(resolve => {
    resolver = resolve
    tm = setTimeout(() => {
      console.log('Time', time, 'done')
      resolve()
    }, time)
  })

  promise.then = promise.then.bind(promise)
  promise.catch = promise.catch.bind(promise)

  return {
    ...promise,
    resolve: resolver,
    cancel: () => clearTimeout(tm)
  }
}

const MINSTART = {}
const MAXEND = {}

const state: { loader?: PageLoader; lastRoute?: Route; updates: any[] } = {
  lastRoute: undefined,
  loader: undefined,
  updates: []
}

function isDefined(val) {
  if (val !== undefined) {
    return val
  }
}

function whenDefined(val, initial) {
  if (isDefined(val)) {
    return val
  }
  return initial
}

class Loader {
  progress: number
  count: number
  completed: boolean
  startTime: number

  constructor(loader) {
    this.isFirstLoad = whenDefined(loader.isFirstLoad, true)
    this.startTime = whenDefined(loader.startTime, Date.now())
    this.maxTime = whenDefined(loader.maxTime, () => 0)
    this.minTime = whenDefined(loader.minTime, () => 0)
    this.complete = whenDefined(loader.complete, false)
    this.count = whenDefined(loader.count, 0)
    this.completed = whenDefined(loader.completed, false)
    this.route = whenDefined(loader.route, null)
    this.progress = whenDefined(loader.progress, 0)
  }

  addProgress() {
    const clone = this.clone()
    clone.progress = clone.progress + 1
    return clone
  }

  clone() {
    return new Loader(this)
  }
}

export function usePageLoader(config?: PageLoaderConfig): PageLoader {
  const route = useRoute()

  const options = {
    minTime: 0,
    maxTime: 10000,
    ...config
  }

  const minTimeFn = typeof options.minTime === 'function' ? options.minTime : () => options.minTime
  const maxTimeFn = typeof options.maxTime === 'function' ? options.maxTime : () => options.maxTime

  const [loader, setLoader] = React.useState(
    state.loader || {
      isFirstLoad: state.lastRoute === undefined,
      startTime: Date.now(),
      maxTime: maxTimeFn,
      minTime: minTimeFn,
      complete: false,
      count: 0,
      completed: 0,
      route,
      progress: 0
    }
  )

  const setUpdates = (fn: any) => {
    state.updates = fn(state.updates)
  }

  React.useEffect(() => {
    if (loader.route !== route) {
      state.lastRoute = route
      setLoader(l => ({
        ...l,
        route
      }))
    }
  }, [route])

  const addPromise = async (promise: Promise<any>, promiseRef: any) => {
    if (!state.updates.includes(promiseRef)) {
      console.log('A')
      setLoader(l => ({
        ...l,
        count: l.count + 1
      }))
      setUpdates((prev: any) => [...prev, promiseRef])

      try {
        const res = await promise
        if (res === 'END_LOADER') {
          console.log('B')
          return setLoader(l => ({
            ...l,
            complete: true,
            progress: l.complete ? 1 : (l.completed + 1) / (l.count + 1)
          }))
        }
      } catch (err) {}

      if (!loader.complete) {
        console.log('C')
        return setLoader(l => ({
          ...l,
          completed: l.completed + 1,
          complete: l.completed === l.count,
          progress: l.complete ? 1 : (l.completed + 1) / (l.count + 1)
        }))
      }
    }
  }

  React.useEffect(() => {
    window.loader = loader
    state.loader = {
      ...loader,
      addPromise
    }

    const offs: any[] = []

    if (loader.minTime) {
      const waiter = wait(loader.minTime(loader))
      addPromise(waiter, MINSTART)
      offs.push(() => waiter.cancel())
    }

    if (loader.maxTime) {
      const waiter = wait(loader.maxTime(loader))
      addPromise(waiter, MAXEND)
      offs.push(() => waiter.cancel())
    }

    return () => offs.forEach(off => off())
  }, [loader])

  return loader
}

/* 
Use page needs to return a function that marks the usePageLoadPromise as complete
*/

const createPromise = () => {
  let resolver
  const promise = new Promise(resolve => (resolver = resolve))
  return { promise, resolve: (resolver as unknown) as ((val: any) => any) }
}

export function usePageLoadPromise(key?: any): Function {
  const loader = usePageLoader()
  const [current, setCurrent] = React.useState(false)

  if (!loader.addPromise) console.log(loader)

  React.useEffect(() => {
    if (!current) {
      setCurrent(createPromise())
    } else {
      console.log('Adding promise')
      loader.addPromise(current.promise, key)
    }
  }, [current])

  return () => {
    current && current.resolve()
    console.log('image-resolved')
  }
}

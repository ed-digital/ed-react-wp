import { parse as parseURL } from 'url'
import { parse as parseQS, stringify as stringifyQS } from 'querystring'
import { Route, RouteMeta } from './types'

type RouteData = Route

export type RouterEvent =
  | {
      type: 'start'
      route: RouteMeta
      transitionConfig: any
    }
  | {
      type: 'end'
      route: Route
      wasBack: boolean
      transitionConfig: any
    }
  | {
      type: 'beganLoading'
      route: RouteMeta
      transitionConfig: any
    }
  | {
      type: 'errorLoading'
      route: RouteMeta
      error: Error
      transitionConfig: any
    }
  | {
      type: 'finishedLoading'
      route: Route
      transitionConfig: any
    }

type Subscriber = (route: RouterEvent) => void | any

type Disposer = () => void

declare global {
  interface Window {
    INITIAL_PAGE: any
  }
}

export default class Router {
  disposers: Disposer[] = []
  subscribers: Subscriber[] = []
  route: Route

  requestCounter: number = 0
  routeCounter: number = 0

  cache = new RouterCache()

  constructor() {
    // Get the initial route, if any
    this.route = {
      ...this.getRouteMeta(document.location.href),
      ...(window['INITIAL_PAGE'] || { kind: 'front-page' })
    }

    // Begin listening for popstate events
    const handlePopState = (e: PopStateEvent) => {
      this.goTo(document.location.href, e)
    }
    window.addEventListener('popstate', handlePopState)
    this.disposers.push(() => window.removeEventListener('popstate', handlePopState))
  }

  dispose() {
    for (const dispose of this.disposers) {
      dispose()
    }
  }

  subscribe(subscriber: Subscriber): Disposer {
    this.subscribers.push(subscriber)
    return () => {
      const index = this.subscribers.indexOf(subscriber)
      if (index !== -1) this.subscribers.splice(index, 1)
    }
  }

  publish(e: RouterEvent) {
    for (let i = 0; i < this.subscribers.length; i++) {
      const subscriber = this.subscribers[i]
      subscriber(e)
    }
  }

  preload(url: string) {
    // console.log('Preloading', url)
  }

  getRouteMeta(url: string): RouteMeta {
    const parsed = parseURL(url)
    const query = parseQS(parsed.query || '')

    return {
      key: 'route-' + ++this.routeCounter,
      path: parsed.pathname || '',
      query: query || {},
      transitionConfig: null
    }
  }

  async goTo(url: string, popEvent?: PopStateEvent, transitionConfig?: any) {
    const requestID = ++this.requestCounter

    if (!popEvent) {
      history.pushState({}, '', url)
    }

    // Data we collect about the route
    let meta: RouteMeta = this.getRouteMeta(url)
    let routeData: RouteData

    // We only emit the loading event if we have to!
    let loadingStarted = false

    // Publish the 'start' event
    this.publish({
      type: 'start',
      route: meta,
      transitionConfig
    })

    // Check the cache first
    if (this.cache.has(meta)) {
      routeData = this.cache.get(meta)
    } else {
      this.publish({
        type: 'beganLoading',
        route: meta,
        transitionConfig
      })
      try {
        routeData = await this.fetchRouteData(url)
        if (!routeData) throw new Error('The server did not return any routing data')
        if (this.requestCounter !== requestID) return
      } catch (err) {
        this.publish({
          type: 'errorLoading',
          route: meta,
          error: err,
          transitionConfig
        })
        console.error(err)
        return
      }
      this.publish({
        type: 'finishedLoading',
        route: {
          ...meta,
          ...routeData
        },
        transitionConfig
      })
    }

    // Now set the route!
    this.route = {
      ...meta,
      ...routeData,
      transitionConfig
    }
    this.publish({
      type: 'end',
      route: this.route,
      wasBack: !!popEvent,
      transitionConfig
    })
    this.didChange()
  }

  goBack() {
    window.history.back()
  }

  /*
    Searches each of the following sources for metadata about the route:
    - application
    - cache
    - the server
  */
  async fetchRouteData(url: string): Promise<RouteData> {
    const meta = this.getRouteMeta(url)

    // Fetch data from the server
    const targetURL = meta.path + '?' + stringifyQS({ 'xhr-json': '', ...(meta.query || {}) })
    const response = await fetch(targetURL, {})
    const data = await response.json()
    if (!data.noCache) {
      this.cache.set(meta, data)
    }
    return data
  }

  didChange() {
    // @ts-ignore
    setEditButton(this.route.edit)
  }
}

function setEditButton(edit?: [string, string]) {
  const element = document.getElementById('wp-admin-bar-edit')
  if (!element) return
  if (!edit) {
    element.innerHTML = ''
  } else {
    element.innerHTML = `
      <a class="ab-item" href="${edit[0]}">${edit[1]}</a>
    `
  }
}

class RouterCache {
  items: { [key: string]: RouteData } = {}

  clear() {
    this.items = {}
  }

  getCacheKey(meta: RouteMeta): string {
    return btoa(JSON.stringify({ ...meta, id: '' }))
  }

  has(meta: RouteMeta): boolean {
    const key = this.getCacheKey(meta)
    if (key in this.items) {
      return true
    } else {
      return false
    }
  }

  get(meta: RouteMeta): RouteData {
    const key = this.getCacheKey(meta)
    return this.items[key]
  }

  set(meta: RouteMeta, data: RouteData) {
    const key = this.getCacheKey(meta)
    this.items[key] = data
  }
}

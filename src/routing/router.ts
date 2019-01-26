import { parse as parseURL } from 'url'
import { parse as parseQS, stringify as stringifyQS } from 'querystring'

type RouteMeta = {
  path: string
  query: any
}

type RouteData = {
  [index: string]: any
}

export type Route = RouteMeta & {
  [index: string]: any
}

export type RouterEvent =
  | {
      type: 'start'
      route: RouteMeta
    }
  | {
      type: 'end'
      route: Route
    }
  | {
      type: 'beganLoading'
      route: RouteMeta
    }
  | {
      type: 'errorLoading'
      route: RouteMeta
      error: Error
    }
  | {
      type: 'finishedLoading'
      route: Route
    }

type Subscriber = (route: RouterEvent) => void | any

type Disposer = Function

export default class Router {
  disposers: Disposer[] = []
  subscribers: Subscriber[] = []
  route: Route

  requestCounter: number = 0

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
    console.log('Preloading', url)
  }

  getRouteMeta(url: string): RouteMeta {
    const parsed = parseURL(url)
    const query = parseQS(parsed.query)

    return {
      path: parsed.pathname,
      query: query || {}
    }
  }

  async goTo(url: string, popEvent: PopStateEvent) {
    const requestID = ++this.requestCounter
    history.pushState({}, '', url)

    // Data we collect about the route
    let meta: RouteMeta = this.getRouteMeta(url)
    let routeData: RouteData

    // We only emit the loading event if we have to!
    let loadingStarted = false

    // Publish the 'start' event
    this.publish({
      type: 'start',
      route: meta
    })

    // Check the cache first
    if (this.cache.has(meta)) {
      routeData = this.cache.get(meta)
    } else {
      this.publish({
        type: 'beganLoading',
        route: meta
      })
      try {
        routeData = await this.fetchRouteData(url)
        if (!routeData) throw new Error('The server did not return any routing data')
        if (this.requestCounter !== requestID) return
      } catch (err) {
        this.publish({
          type: 'errorLoading',
          route: meta,
          error: err
        })
        console.error(err)
        return
      }
      this.publish({
        type: 'finishedLoading',
        route: {
          ...meta,
          ...routeData
        }
      })
    }

    // Now set the route!
    this.route = {
      ...meta,
      ...routeData
    }
    this.publish({
      type: 'end',
      route: this.route
    })
    this.didChange()
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
    setEditButton(this.route.edit)
  }
}

function setEditButton(edit?: [string, string]) {
  const element = document.getElementById('wp-admin-bar-edit')
  if (!edit) {
    element.innerHTML = ''
  } else {
    element.innerHTML = `
      <a class="ab-item" href="${edit[0]}">${edit[1]}</a>
    `
  }
}

class RouterCache {
  items = {}

  clear() {
    this.items = {}
  }

  getCacheKey(meta: RouteMeta): string {
    return btoa(JSON.stringify(meta))
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
    return this.items[key].data
  }

  set(meta: RouteMeta, data: RouteData) {
    const key = this.getCacheKey(meta)
    this.items[key] = data
  }
}

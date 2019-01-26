import * as React from 'react'
import { RouterContext, RouteItemContext } from './context'
import Router from './router'

export default function WPRouter(props: { children: React.ReactNode }) {
  // Create a new Router object, just once
  const router = React.useMemo(() => new Router(), [])

  // Keep the currentRoute synced to the routers current route
  const [currentRoute, setCurrentRoute] = React.useState(router.route)
  React.useEffect(() => {
    router.subscribe(e => {
      if (e.type === 'end') {
        setCurrentRoute(e.route)
      }
    })
    return () => router.dispose()
  }, [])

  return (
    <RouterContext.Provider value={router}>
      <RouteItemContext.Provider value={currentRoute}>{props.children}</RouteItemContext.Provider>
    </RouterContext.Provider>
  )
}

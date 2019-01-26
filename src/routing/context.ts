import * as React from 'react'
import Router, { Route } from './router'

/* Routing Stuff */

export const RouteItemContext = React.createContext<Route>(undefined)
export const RouterContext = React.createContext<Router>(undefined)

export function useRouter() {
  return React.useContext(RouterContext)
}

export function useRoute() {
  return React.useContext(RouteItemContext)
}

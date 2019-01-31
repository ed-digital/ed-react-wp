import * as React from 'react'
import Router, { Route } from './router'

/* Routing Stuff */

export const RouteItemContext = React.createContext<Route | null>(null)
export const RouterContext = React.createContext<Router | null>(null)

export function useRouter() {
  return React.useContext(RouterContext)
}

export function useRoute() {
  return React.useContext(RouteItemContext)
}

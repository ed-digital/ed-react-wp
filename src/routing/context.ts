import * as React from 'react'
import Router from './router'
import { Route } from './types'

/* Routing Stuff */

export const RouteItemContext = React.createContext<Route | undefined>(undefined)
export const RouterContext = React.createContext<Router | undefined>(undefined)

export function useRouter() {
  return React.useContext(RouterContext)
}

export function useRoute() {
  return React.useContext(RouteItemContext)
}

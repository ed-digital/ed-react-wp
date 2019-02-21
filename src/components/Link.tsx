import * as React from 'react'
import { Route } from '../routing/types'
import { useRouter } from '../routing/context'

export interface ACFLink {
  url: string
  title: string
  target: string
}

type Props = {
  href: string
  className?: string
  waitFor?: () => Promise<any>
  transitionConfig?: any
  then?: (route?: Route) => void
  [key: string]: any
}

export default function Link(props: Props) {
  const router = useRouter()

  React.useEffect(() => {
    if (router) return router.preload(props.href)
  }, [props.href])

  // let mounted = true
  // React.useEffect(() => () => (mounted = false), [])

  return (
    <a
      className={props.className}
      href={props.href}
      target={props.target}
      {...props.attrs}
      onClick={async e => {
        if (router) {
          if (props.target && props.target !== '_self') return
          if (props.onClick) props.onClick(e)
          if (!e.isDefaultPrevented()) {
            e.preventDefault()
            if (props.waitFor) {
              await props.waitFor()
            }
            await router.goTo(props.href, undefined, props.transitionConfig)
            if (props.then) {
              props.then(router.route)
            }
          }
        }
      }}
    >
      {props.children}
    </a>
  )
}

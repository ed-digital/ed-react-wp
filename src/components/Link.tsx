import * as React from 'react'
import { useRouter } from '../routing/context'

type Props = {
  href: string
  waitFor?: () => Promise<any>
  transitionConfig?: any
  [key: string]: any
}

export default function Link(props: Props) {
  const router = useRouter()

  React.useEffect(() => {
    if (router) return router.preload(props.href)
  }, [props.href])

  let mounted = true
  React.useEffect(() => () => (mounted = false), [])

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
            router.goTo(props.href, undefined, props.transitionConfig)
          }
        }
      }}
    >
      {props.children}
    </a>
  )
}

import * as React from 'react'
import { Route } from '../routing/types'
import { useRouter } from '../routing/context'
import { useInView } from 'react-intersection-observer'

const isInternalLink = (url: string) => {
  return (
    (url.indexOf(window.location.protocol + '//' + window.location.host) === 0 ||
      url.match(/^\//)) &&
    !url.match(/wp-content/)
  )
}

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

  const [ref, inView] = useInView({
    threshold: 0,
    rootMargin: `${window.innerHeight / 4}px`,
    triggerOnce: true
  })

  /* Only pleload if this link has been in view for more than n seconds */
  React.useEffect(() => {
    const doPreload = () => {}

    const tm = setTimeout(() => {
      if (router && inView) return router.preload(props.href)
    }, 4000)

    return () => clearTimeout(tm)
  }, [inView, props.href])

  const isAdmin = document.location.href.indexOf('wp-admin') !== -1

  return (
    <a
      ref={ref}
      className={props.className}
      href={props.href}
      target={props.target}
      {...props.attrs}
      onClick={async e => {
        if (isAdmin) {
          e.preventDefault()
          return
        }
        if (router) {
          if ((props.target && props.target !== '_self') || !isInternalLink(props.href)) {
            return
          }
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

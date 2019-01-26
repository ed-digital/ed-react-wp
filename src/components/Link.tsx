import * as React from 'react'
import { useRouter } from '../routing/context'

type Props = {
  href: string
  [key: string]: any
}

export default function Link(props: Props) {
  const router = useRouter()

  React.useEffect(() => router.preload(props.href), [props.href])

  return (
    <a
      className={props.className}
      href={props.href}
      target={props.target}
      {...props.attrs}
      onClick={e => {
        if (props.target && props.target !== '_self') return
        if (props.onClick) props.onClick(e)
        if (!e.isDefaultPrevented()) {
          router.goTo(props.href, undefined)
          e.preventDefault()
        }
      }}
    >
      {props.children}
    </a>
  )
}

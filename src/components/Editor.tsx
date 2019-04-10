import * as React from 'react'
import styled from 'styled-components'

interface RichTextProps {
  onChange: (text: string) => any
  tagName: string
  value: string
  placeholder?: string
  multiline?: keyof HTMLElementTagNameMap | false
}

export function RichText(props: RichTextProps) {
  const WPRichText = window.wp.editor.RichText
  return <WPRichText {...props} />
}

interface InnerBlocks {
  allowedBlocks?: string[]
  template?: any[]
  templateLock: boolean | 'all' | 'insert'
}

export function InnerBlocks(props: InnerBlocks) {
  const WPInnerBlocks = window.wp.editor.InnerBlocks
  return <WPInnerBlocks {...props} />
}

export function MetaBox(props: { groupSlug: string }) {
  const ref = React.useRef<HTMLFormElement>(null)

  React.useEffect(() => {
    const el = document.getElementById('acf-' + props.groupSlug)
    if (!el) {
      console.error('Could not find metabox with slug ' + props.groupSlug)
      return
    }
    const clone = document.createElement('div')
    const originalParent = el.parentNode as HTMLDivElement
    originalParent.appendChild(clone)
    // @ts-ignore
    ref.current.appendChild(el)
    // let wasSaving = false
    // const editor = wp.data.select('core/editor')
    // const dispose = wp.data.subscribe(() => {
    //   if (editor.isSavingPost() && !wasSaving) {
    //     console.log('Saving...')
    //     originalParent.appendChild(el)
    //     wasSaving = true
    //   } else if (!editor.isSavingPost() && wasSaving) {
    //     console.log('Unsaving...')
    //     ref.current.appendChild(el)
    //     wasSaving = false
    //   }
    // })

    let interval = setInterval(() => {
      // @ts-ignore
      const data = window.jQuery(ref.current).serializeArray()
      clone.innerHTML = ''
      for (const item of data) {
        const input = document.createElement('input')
        clone.appendChild(input)
        input.type = 'hidden'
        input.name = item.name
        input.value = item.value
      }
    }, 1000)

    // acf.addFilter('prepare_for_ajax', () => {
    //   console.log('Preparing for ajax')
    //   originalParent.appendChild(el)
    // })

    return () => {
      originalParent.appendChild(el)
      clearInterval(interval)
    }
  }, [])

  return (
    <MetaBoxStyle className="meta-box-sortables">
      <form ref={ref} onSubmit={e => e.preventDefault()} />
    </MetaBoxStyle>
  )
}

const MetaBoxStyle = styled.div`
  h2.hndle {
    padding: 15px;
    margin: 0px;
  }

  .acf-field p.description {
    font-size: 14px;
    font-style: normal;
  }
`

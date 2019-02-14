import React, { ReactElement } from 'react'

interface RichTextProps {
  onChange: (text: string) => void
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
}

export function InnerBlocks(props: InnerBlocks) {
  const WPInnerBlocks = window.wp.editor.InnerBlocks
  return <WPInnerBlocks {...props} />
}

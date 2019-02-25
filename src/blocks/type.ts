import * as React from 'react'

export type BlockType = {
  title: string
  icon: string
  attributes?: any
  category: string
  parent?: string[]
  edit: any
  save: any
}

export type Block = {
  innerHTML: string
}

export type EditParams<Props> = {
  setAttributes: (attrs: { [index: string]: any }) => void
  attributes: Props
}

export type RenderParams<Props> = {
  attributes: Props
  innerBlocks: React.ReactNode[] | React.ReactNode
}

export type BlockTypeDef<Props> = {
  title: string
  description: string
  icon: any
  category: string
  supports?: any
  parent?: string[]
  attributes?: { [index: string]: any }
  component: React.ComponentType<RenderParams<Props>>
  edit: React.ComponentType<EditParams<Props>>
}

export type WPBlockTypeDef<Props> = {
  title: string
  description: string
  icon: any
  attributes?: { [index: string]: any }
  category: string
  parent?: string[]
  render: (props: { attributes: Props; innerBlocks: React.ReactNode }) => React.ReactNode
  edit: React.ComponentType<EditParams<Props>>
  save: Function
  supports: {}
}

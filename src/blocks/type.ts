import { ComponentType } from 'react'

export type BlockType = {
  title: string
  icon: string
  attributes?: any
  category: string
  edit: any
  save: any
}

export type Block = {
  innerHTML: string
}

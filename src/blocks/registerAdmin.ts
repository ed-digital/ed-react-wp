import { callAPI } from '../api'
import { BlockType, WPBlockTypeDef } from './type'

declare global {
  interface Window {
    wp: any
  }
}

export default function(
  blockTypes: any,
  wrap?: (props: { children: React.ReactNode }) => React.ReactNode,
  filterBlockTypes?: (name: string, def: WPBlockTypeDef<any>) => boolean
) {
  const blockMetas = []

  for (const ns in blockTypes) {
    const blocks = blockTypes[ns]
    for (const name in blocks) {
      const fullName = ns + '/' + name
      const module = blocks[name]
      const defaultModule = module.default ? module.default : module
      const blockType =
        typeof defaultModule === 'function' ? defaultModule(fullName) : defaultModule
      const existing = window.wp.blocks.getBlockType(fullName)
      blockMetas.push({
        name: fullName,
        title: blockType.title
      })
      if (existing && blockType.edit) {
        blockType.edit = existing.edit
      }
      if (wrap) {
        const originalEdit = blockType.edit
        blockType.edit = (...args: any[]) => wrap({ children: originalEdit(...args) })
      }
      if (existing) {
        Object.assign(existing, blockType)
      } else {
        window.wp.blocks.registerBlockType(fullName, blockType)
      }
    }
  }

  // Hide hidden blocks
  wp.domReady(() => {
    unregisterHiddenBlocks()

    // Filter out core blocks which we don't want
    if (filterBlockTypes) {
      const types = [...wp.blocks.getBlockTypes()]
      for (const type of types) {
        if (!filterBlockTypes(type.name, type)) {
          wp.blocks.unregisterBlockType(type.name)
        }
      }
    }

    wp.blocks.setDefaultBlockName('none')
  })

  // Send to the server, for ACF
  callAPI('activeBlockTypes', { types: blockMetas })
}

function unregisterHiddenBlocks() {
  const blockTypes = wp.blocks.getBlockTypes()
  blockTypes
    .filter((item: any) => item.keywords && item.keywords.indexOf('hidden') !== -1)
    .forEach((item: any) => (item.parent = ['no/parent']))
}

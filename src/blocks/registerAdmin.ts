import { callAPI } from '../api'

declare global {
  interface Window {
    wp: any
  }
}

export default function(
  blockTypes: any,
  wrap?: (props: { children: React.ReactNode }) => React.ReactNode
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

  // Send to the server, for ACF
  callAPI('activeBlockTypes', { types: blockMetas })
}

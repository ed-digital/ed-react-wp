import coreFrontEnd from './default'
import { WPBlockTypeDef } from './type'

let registeredBlocks: { [name: string]: WPBlockTypeDef<any> } = {}

export default function(blockTypes: any) {
  registeredBlocks = {}

  const compile = (items: any) => {
    for (const ns in items) {
      const blocks = items[ns]
      for (const name in blocks) {
        const fullName = ns + '/' + name
        const module = blocks[name].default
        const blockType = typeof module === 'function' ? module(fullName) : module
        if (!blockType) {
          return console.error('FrontEnd: ', fullName, 'did not export a module')
        }
        if (blockType.override) {
          // An override block
          registeredBlocks[fullName] = blockType.getBlock(fullName, false)
        } else {
          registeredBlocks[fullName] = blockType
        }
      }
    }
  }

  compile(coreFrontEnd)
  compile(blockTypes)
}

export function getFrontEndBlocks() {
  return registeredBlocks
}

window.getFrontEndBlocks = getFrontEndBlocks

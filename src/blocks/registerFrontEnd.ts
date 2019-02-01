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
        console.log('Adding block type', fullName)
        const module = blocks[name].default
        const blockType = typeof module === 'function' ? module(fullName) : module
        registeredBlocks[fullName] = blockType
      }
    }
  }

  compile(coreFrontEnd)
  console.log('Core front end', coreFrontEnd)
  compile(blockTypes)
}

export function getFrontEndBlocks() {
  return registeredBlocks
}

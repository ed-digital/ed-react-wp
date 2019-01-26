import { callAPI } from '../api'

export default function(blockTypes) {
  const blockMetas = []

  console.log(blockTypes)

  for (const ns in blockTypes) {
    const blocks = blockTypes[ns]
    for (const name in blocks) {
      const fullName = ns + '/' + name
      const module = blocks[name]
      const blockType = module.default ? module.default : module
      const existing = global['wp'].blocks.getBlockType(fullName)
      blockMetas.push({
        name: fullName,
        title: blockType.title
      })
      if (existing) {
        Object.assign(existing, blockType)
      } else {
        global['wp'].blocks.registerBlockType(fullName, blockType)
      }
    }
  }

  // Send to the server, for ACF
  callAPI('activeBlockTypes', { types: blockMetas })
}

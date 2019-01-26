const coreFrontEnd = require('./default/*/*.tsx')

export default function(blockTypes) {
  const blockRenderers = {}

  for (const ns in coreFrontEnd) {
    const blocks = coreFrontEnd[ns]
    for (const name in blocks) {
      const fullName = ns + '/' + name
      const module = blocks[name]
      const blockType = module.default ? module.default : module
      blockRenderers[fullName] = blockType
    }
  }

  for (const ns in blockTypes) {
    const blocks = blockTypes[ns]
    for (const name in blocks) {
      const fullName = ns + '/' + name
      const module = blocks[name]
      const blockType = module.default ? module.default : module
      blockRenderers[fullName] = blockType
    }
  }

  window['_ED_BLOCK_RENDERERS'] = blockRenderers
}

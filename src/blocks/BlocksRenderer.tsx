import * as React from 'react'
// import { parse } from '@wordpress/block-serialization-default-parser'
import { Block } from './type'
import { getFrontEndBlocks } from './registerFrontEnd'

type BlockWrapper = (content: React.ReactNode, block: Block, parents: Block[]) => React.ReactNode

type Props = {
  content: any
  wrapBlock?: BlockWrapper
}

function getBlockList(items: Block[], parents: Block[], wrap?: BlockWrapper) {
  const blockRenderers = getFrontEndBlocks()
  return items
    .map((block: any, k: number) => {
      let content

      // Attempt to render the block dynamically
      if (block.blockName in blockRenderers) {
        const blockType = blockRenderers[block.blockName]
        if (blockType.render) {
          content = blockType.render({
            ...block,
            attributes: block.attrs,
            innerBlocks: getBlockList(block.innerBlocks, [block, ...parents], wrap)
          })
        }
      }

      // Failing dynamic rendering, just spit out the innerHTML
      if (content === undefined)
        content = <span dangerouslySetInnerHTML={{ __html: block.innerHTML }} />

      // Wrap the content, if a wrap function was supplied
      if (wrap) content = wrap(content, block, parents)

      // Done
      return <React.Fragment key={k}>{content}</React.Fragment>
    })
    .filter(item => !!item)
}

export default function BlocksRenderer(props: Props) {
  return <span>{getBlockList(props.content, [], props.wrapBlock)}</span>
}

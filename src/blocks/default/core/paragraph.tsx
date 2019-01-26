import * as React from 'react'

export default {
  render: (block, children) => {
    return <span dangerouslySetInnerHTML={{ __html: block.innerHTML }} />
  }
}

import * as React from 'react'

export default {
  render: props => {
    return <span dangerouslySetInnerHTML={{ __html: props.innerHTML }} />
  }
}

import * as React from 'react'
import styled from 'styled-components'

export default {
  render: props => {
    console.log('Single column', props)
    return <Wrapper>{props.innerBlocks}</Wrapper>
  }
}

const Wrapper = styled.div`
  flex: 1 1 auto;
  border-left: 1px solid black;

  &:first-child {
    border-left: 0px;
  }
`

import * as React from 'react'
import styled from 'styled-components'

export default {
  render: props => {
    return <Wrapper>{props.innerBlocks}</Wrapper>
  }
}

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  border: 1px solid black;
`

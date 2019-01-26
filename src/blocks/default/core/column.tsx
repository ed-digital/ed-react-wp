import * as React from 'react'
import styled from 'styled-components'

export default {
  render: (block, children) => {
    return <Wrapper>{children}</Wrapper>
  }
}

const Wrapper = styled.div`
  flex: 1 1 auto;
  border-left: 1px solid black;

  &:first-child {
    border-left: 0px;
  }
`

import * as React from 'react'
import styled from 'styled-components'
import { inspect } from 'util'

export default function dump(...args: any[]) {
  console.log(
    ...args.reduce(
      (arr, el) => {
        arr.push(`# ${typeof el}`, el)
        return arr
      },
      [`Dump:`]
    )
  )
  return (
    <Wrapper>
      {args.map((el, i) => {
        const message = typeof el === 'object' && el !== null ? inspect(el, { depth: 10 }) : `${el}`
        return (
          <pre key={message + i}>
            <p># {typeof el}</p>
            {message}
          </pre>
        )
      })}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  position: relative;
`

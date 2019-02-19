import React from 'react'

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
    <div>
      {args.map((el, i) => {
        const message = typeof el === 'object' && el !== null ? JSON.stringify(el, null, 2) : el
        return (
          <pre key={message + i}>
            <p># {typeof el}</p>
            {message}
          </pre>
        )
      })}
    </div>
  )
}

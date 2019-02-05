import * as React from 'react'
import * as ReactDOM from 'react-dom'

declare global {
  interface Window {
    React: any
    ReactDOM: any
    wp: any
  }
}

if (window.React) {
  Object.assign(window.React, React)
  window.React.StrictMode = (props: any) => <React.Fragment>{props.children}</React.Fragment>
  Object.assign(window.ReactDOM, ReactDOM)
}

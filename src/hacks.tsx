import * as React from 'react'
import * as ReactDOM from 'react-dom'

if (window.React) {
  Object.assign(window.React, React)
  window.React.StrictMode = props => <React.Fragment>{props.children}</React.Fragment>
  Object.assign(window.ReactDOM, ReactDOM)
}

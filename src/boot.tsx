import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { BlockType } from './blocks/type'
import registerAdminBlockTypes from './blocks/registerAdmin'
import registerFrontEndBlockTypes from './blocks/registerFrontEnd'

import WPRouter from './routing/WPRouter'

type BootArgs = {
  AppComponent: React.ComponentType
  AdminComponent?: React.ComponentType
  blockTypes: {
    [name: string]: BlockType
  }
  wrapAdminBlocks?: (props: { children: React.ReactNode }) => React.ReactNode
}

export default function(args: BootArgs) {
  if (window.location.href.indexOf('wp-admin') !== -1) {
    registerAdminBlockTypes(args.blockTypes, args.wrapAdminBlocks)
    if (args.AdminComponent) {
      const el = document.createElement('div')
      document.body.appendChild(el)
      ReactDOM.render(<args.AdminComponent />, el)
    }
    console.log('Admin')
    // We want more than 600px wide content
    setImmediate(() => {
      console.log('HELLOO')
      const style = document.createElement('style')
      style.innerHTML = '.wp-block { max-width: 100% !important; }'
      document.head.appendChild(style)
    })
  } else {
    registerFrontEndBlockTypes(args.blockTypes)
    ReactDOM.render(
      <WPRouter>
        <args.AppComponent />
      </WPRouter>,
      document.getElementById('app')
    )
  }
}

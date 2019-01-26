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
}

export default function(args: BootArgs) {
  if (window.location.href.indexOf('wp-admin') !== -1) {
    registerAdminBlockTypes(args.blockTypes)
    if (args.AdminComponent) {
      const el = document.createElement('div')
      document.body.appendChild(el)
      ReactDOM.render(<args.AdminComponent />, el)
    }
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

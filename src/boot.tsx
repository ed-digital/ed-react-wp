import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { BlockType, WPBlockTypeDef } from './blocks/type'
import registerAdminBlockTypes from './blocks/registerAdmin'
import registerFrontEndBlockTypes from './blocks/registerFrontEnd'

import WPRouter from './routing/WPRouter'

type BootArgs = {
  AppComponent: React.ComponentType
  AdminComponent?: React.ComponentType
  filterBlockTypes?: (name: string, def: WPBlockTypeDef<any>) => boolean
  blockTypes: {
    [name: string]: BlockType
  }
  wrapAdminBlocks?: (props: { children: React.ReactNode }) => React.ReactNode
}

export default function(args: BootArgs) {
  if (window.location.href.indexOf('wp-admin') !== -1) {
    if (args.AdminComponent) {
      const el = document.createElement('div')
      document.body.appendChild(el)
      ReactDOM.render(<args.AdminComponent />, el)
    }

    // Hide hidden blocks
    registerAdminBlockTypes(args.blockTypes, args.wrapAdminBlocks, args.filterBlockTypes)
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

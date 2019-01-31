import WPRouter from './routing/WPRouter'
import { useRoute, useRouter } from './routing/context'
import { callAPI, useAPI } from './api'
import boot from './boot'
import { useMenu } from './menus/useMenu'
import Link from './components/Link'
import './hacks'

export * from './routing/types'
export { blockType } from './blocks/wrapper'
export { WPRouter, useRoute, useRouter, boot, callAPI, useAPI, useMenu, Link }

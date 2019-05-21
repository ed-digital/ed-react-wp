import { useAPI } from '../api'
import { useRoute } from '../routing/context'
import { parse as parseURL } from 'url'

export type WPMenuSelector = {
  menu?: number | string // The slug or ID of the menu
  themeLocation?: string // The theme location
  depth?: number
}

export type WPMenuItem = {
  id: string | number
  label: string
  objectType: string
  objectID: number
  href: string
  target: string
  parent: number
  original: { [index: string]: any }
  children: WPMenuItem[]
  active: boolean
  childActive: boolean
  menuOrder: number
}

export function useMenu(props: WPMenuSelector) {
  const { callState, data, error } = useAPI('wp/menu', {
    menu: props.menu,
    themeLocation: props.themeLocation,
    depth: props.depth
  })

  // @ts-ignore
  const { path } = useRoute()

  const tree = data ? buildMenuTree(data, path) : []

  return { callState, tree, error }
}

function buildMenuTree(items: any[], currentPath: string): WPMenuItem[] {
  const tree = []
  const leaves: { [index: string]: WPMenuItem } = {}

  for (const item of items) {
    const node: WPMenuItem = (leaves[item.ID] = {
      id: item.ID,
      label: item.title,
      objectType: item.object,
      objectID: Number(item.object_id),
      href: item.url,
      target: item.target,
      parent: Number(item.menu_item_parent),
      original: item,
      menuOrder: item.menu_order,
      children: [],
      childActive: false,
      active: false
    })
    const state = getMenuItemState(node, currentPath)
    node.active = state.active
    node.childActive = state.childActive
  }

  for (const key in leaves) {
    const item = leaves[key]
    if (item.parent) {
      leaves[item.parent].children.push(item)
    } else {
      tree.push(item)
    }
  }
  tree.sort((a, b) => a.menuOrder - b.menuOrder)
  return tree
}

const cleanPath = (href: string) => {
  let { pathname } = parseURL(href)
  if (typeof pathname !== 'string') pathname = href
  return typeof pathname === 'string' ? pathname.toLowerCase().replace(/(^\/|\/$)/g, '') : ''
}

export function getMenuItemState(
  item: WPMenuItem,
  path: string
): { active: boolean; childActive: boolean } {
  const itemPath = cleanPath(item.href)
  const currentPath = cleanPath(path)
  let active = false
  let childActive = false
  if (itemPath === currentPath) {
    active = true
  } else if (itemPath.indexOf(currentPath) === 0) {
    childActive = true
  }
  return { active, childActive }
}

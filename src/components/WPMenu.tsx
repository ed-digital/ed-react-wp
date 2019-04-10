import * as React from 'react'
import { useMenu, WPMenuSelector, WPMenuItem, getMenuItemState } from '../menus/useMenu'
import styled, { AnyStyledComponent } from 'styled-components'
import { useRoute } from '../routing/context'

type MenuRenderers = {
  group: AnyStyledComponent
  link: AnyStyledComponent
  itemWrapper: AnyStyledComponent
}

type Props = WPMenuSelector & Partial<MenuRenderers> & {}

// const renderGroup = (
//   nodes: WPMenuItem[],
//   renderers: MenuRenderers,
//   path: string
// ): React.ReactNode => {
//   return renderers.group({
//     children: nodes.map((node, k) =>
//       renderItemOuter({
//         node: node,
//         key: node.id
//       })
//     )
//   })
// }

// const renderItemOuter = (props: { node: WPMenuItem; key?: any }) => {
//   return
// }

export default function WPMenu(props: Props) {
  const { tree } = useMenu(props)
  // @ts-ignore
  const { path } = useRoute()

  return null

  // const renderers = {
  //   group: props.group || defaultRenderers.group,
  //   link: props.link || defaultRenderers.link,
  //   itemWrapper: props.itemWrapper || defaultRenderers.itemWrapper
  // }
  //
  // return renderGroup(tree, renderers, path)
}

const defaultRenderers = {
  group: styled.ul`
    display: flex;
    list-style: none;
    padding: 0px;
    margin: 0px;
  `,
  itemWrapper: styled.li`
    list-style: none;
    padding: 0px;
    margin: 0px;
  `,
  link: styled.a`
    display: inline-block;
  `
}

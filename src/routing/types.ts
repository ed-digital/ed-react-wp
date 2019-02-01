import { WPPost } from '../posts/post'

export type RouteMeta = {
  path: string
  query: any
}

export type ErrorRoute = RouteMeta & {
  kind: 'error'
  code: number
  message?: string
  meta: { [index: string]: any }
}

export type ArchiveRoute = RouteMeta & {
  kind: 'archive'
  postType: string
  meta: { [index: string]: any }
}

export type PageRoute = RouteMeta & {
  kind: 'page'
  isFrontPage: boolean
  edit?: string
  template: string
  page: WPPost
  meta: { [index: string]: any }
}

export type FrontPageRoute = RouteMeta & {
  kind: 'front-page'
  meta: { [index: string]: any }
}

export type PostRoute = RouteMeta & {
  kind: 'single'
  edit: string
  postType: string
  title: string
  date: string
  status: string
  post: WPPost
  meta: { [index: string]: any }
}

export type Route = ErrorRoute | ArchiveRoute | PageRoute | FrontPageRoute | PostRoute

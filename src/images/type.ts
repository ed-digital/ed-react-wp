import { WPAttachment } from '../files/type'

export type WPImageObject = WPAttachment & {
  type: 'image'
  sizes: {
    [size: string]: string | number
  }
}

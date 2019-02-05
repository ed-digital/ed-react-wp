import { WPAttachment } from '../files/type'

export type WPImage = WPAttachment & {
  type: 'image'
  sizes: {
    [size: string]: string | number
  }
}

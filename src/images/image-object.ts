interface ImageSize {
  width: number
  height: number
  src: string
  name: string
  orientation: string
}

type Falsey = false | null | undefined

export interface ACFImage {
  ID: number
  id: number
  title: string
  filename: string
  filesize: number
  url: string
  link: string
  alt: string
  author: string
  description: string
  caption: string
  name: string
  status: string
  uploaded_to: number
  date: string
  modified: string
  menu_order: number
  mime_type: string
  type: string
  subtype: string
  icon: string
  width: number
  height: number
  sizes: {
    [name: string]: string | number
  }
}

export type MaybeACFImage = Falsey | ACFImage

const PlaceholderColor = 'E6E6E6'
const Placeholder: ACFImage = {
  width: 720,
  height: 480,
  name: `placeholder`,
  ID: 0,
  id: 0,
  title: '',
  filename: '',
  description: '',
  menu_order: 0,
  filesize: 0,
  url: `https://via.placeholder.com/720x480/${PlaceholderColor}/${PlaceholderColor}/?text=`,
  link: `https://via.placeholder.com/720x480/${PlaceholderColor}/${PlaceholderColor}/?text=`,
  alt: '',
  author: '',
  caption: ``,
  status: '',
  uploaded_to: 0,
  date: new Date() + '', // Does '2018-10-13 02:07:25' count as a Date?
  modified: new Date() + '',
  mime_type: 'image/jpeg',
  type: 'image',
  subtype: 'jpeg',
  icon: 'img',
  sizes: {
    large: `https://via.placeholder.com/1920x1080/${PlaceholderColor}/${PlaceholderColor}/?text=`,
    'large-width': 720,
    'large-height': 480,
    square: `https://via.placeholder.com/720x720/${PlaceholderColor}/${PlaceholderColor}/?text=`,
    'square-width': 720,
    'square-height': 480,
    portrait: `https://via.placeholder.com/480x720/${PlaceholderColor}/${PlaceholderColor}/?text=`,
    'portrait-width': 480,
    'portrait-height': 720
  }
}

class ImageObject {
  ID: number
  id: number
  title: string
  filename: string
  filesize: number
  url: string
  link: string
  alt?: string
  author: number | string
  caption?: string
  name: string
  status: string
  uploaded_to: number
  date: Date | string // Does '2018-10-13 02:07:25' count as a Date?
  modified: Date | string
  mime_type: string
  type: string
  subtype: string
  icon: string
  width: number
  height: number
  sizes: ImageSize[]
  orientation: 'landscape' | 'square' | 'portrait'

  constructor(image: ACFImage = Placeholder) {
    this.ID = image.ID
    this.id = image.id
    this.title = image.title
    this.filename = image.filename
    this.filesize = image.filesize
    this.url = image.url
    this.link = image.link
    this.alt = image.alt
    this.author = image.author
    this.caption = image.caption
    this.name = image.name
    this.status = image.status
    this.uploaded_to = image.uploaded_to
    this.date = image.date // Does '2018-10-13 02:07:25' count as a Date?
    this.modified = image.modified
    this.mime_type = image.mime_type
    this.type = image.type
    this.subtype = image.subtype
    this.icon = image.icon
    this.width = image.width
    this.height = image.height
    this.orientation =
      image.width > image.height
        ? 'landscape'
        : image.width === image.height
        ? 'square'
        : 'portrait'

    this.sizes = Object.keys(image.sizes)
      .filter(key => /-width/.test(key))
      .reduce((result: ImageSize[], key) => {
        const sizeName = key.replace('-width', '')
        const width = image.sizes[`${sizeName}-width`] as number
        const height = image.sizes[`${sizeName}-height`] as number
        const size: ImageSize = {
          name: sizeName,
          width,
          height,
          src: image.sizes[sizeName] as string,
          orientation: width > height ? 'landscape' : width === height ? 'square' : 'portrait'
        }
        result.push(size)
        return result
      }, [])
      .sort((a, b) => a.width - b.width)

    this.sizes.push({
      name: 'original',
      width: this.width,
      height: this.height,
      src: this.url,
      orientation: this.orientation
    })
  }

  // Returns a src string
  // <img src={wpImg.src()}/>
  src(name: string = 'original', orientation: string = this.orientation): string {
    const size = this.size(name, orientation)
    return (size && size.src) || PlaceholderObject.src(name, orientation)
  }

  static create(image: ACFImage = Placeholder): ImageObject {
    return new ImageObject(image)
  }

  // Returns a specific ImageSize Object
  // <img src={wpImg.size()}/>
  size(name: string = 'original', orientation: string = this.orientation): ImageSize {
    return (
      this.sizes.find(x => x.name === name && x.orientation === orientation) ||
      PlaceholderObject.size('large', 'landscape')
    )
  }

  /*
  get src on the image class
  */
  static src(img: ACFImage | Falsey, name: string = 'original'): string {
    if (img) {
      const image = new ImageObject(img)
      return image.src(name)
    }

    return ImageObject.src(Placeholder, name)
  }

  // Returns a srcset string
  // <img srcset={wpImg.srcSet()}/>
  srcSet(orientation: string = this.orientation): string {
    return (
      this.sizes
        .filter(x => x.orientation === orientation)
        .reduce((srcs: string[], size) => {
          srcs.push(`${size.src} ${size.width}w`)
          return srcs
        }, [])
        .join(',\n') || PlaceholderObject.src(orientation) + ` ${PlaceholderObject.width}w`
    )
  }

  static srcSet(img: ACFImage | Falsey, orientation?: string): string {
    if (img) {
      const image = new ImageObject(img)
      return image.srcSet(orientation || image.orientation)
    }

    return ImageObject.srcSet(Placeholder, orientation) + ` ${Placeholder.width}w`
  }
}

const PlaceholderObject = new ImageObject(Placeholder)

export default ImageObject

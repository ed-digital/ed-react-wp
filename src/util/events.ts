import { value, ValueReaction } from 'popmotion'

type EventSrc =
  | HTMLElement
  | Window
  | Document
  | {
      addEventListener(event: string, cb: (e: any) => any): null
      removeEventListener(event: string, cb: (e: any) => any): null
    }

export function on(element: EventSrc, events: string, callback: (e: any) => any) {
  let disposed = false
  const eventNames = events.split(' ')
  eventNames.forEach(name => element.addEventListener(name, callback))

  const dispose = () => {
    if (disposed) return
    disposed = true
    eventNames.forEach(name => element.removeEventListener(name, callback))
  }

  return dispose
}

function NOOP() {}

interface PointerCallbacks {
  start?: (event: StartPointerEvent) => any
  move?: (event: MovePointerEvent) => any
  stop?: (event: MovePointerEvent) => any
}

interface StartPointerEvent {
  velocityX: number
  velocityY: number
  y: number
  x: number
  clientX: number
  clientY: number
  pageY: number
  pageX: number
  dX: number
  dY: number
  DX: number
  DY: number
  preventDefault: () => any
  stopPropagation: () => any
  time: number
  type: 'touchstart' | 'mousedown' | 'mousemove' | 'touchmove' | 'touchend' | 'mouseup'
}

interface MovePointerEvent extends StartPointerEvent {
  deltaX: number
  deltaY: number
  deltaTime: number
}

export function pointer(element: EventSrc, cbs: PointerCallbacks) {
  const onStart = on(element, 'touchstart mousedown', e => {
    const initialX = Number(typeof e.clientX !== 'undefined' ? e.clientX : e.touches[0].clientX)
    const initialY = Number(typeof e.clientY !== 'undefined' ? e.clientY : e.touches[0].clientY)

    const valueX = value(initialX)
    const valueY = value(initialY)

    let last: StartPointerEvent | MovePointerEvent

    /*
      Special pointer event that handles delta and velocity
      Created on start to use current valueX and valueY vars
    */
    function createEvent(e: any) {
      const clientX = Number(typeof e.clientX !== 'undefined' ? e.clientX : e.touches[0].clientX)
      const clientY = Number(typeof e.clientY !== 'undefined' ? e.clientY : e.touches[0].clientY)

      const pageX = typeof e.pageX !== 'undefined' ? e.pageX : e.touches[0].pageX
      const pageY = typeof e.pageY !== 'undefined' ? e.pageY : e.touches[0].pageY

      valueX.update(clientX)
      valueY.update(clientY)

      const time = performance.now()

      const event: StartPointerEvent = {
        velocityX: valueX.getVelocity(),
        velocityY: valueY.getVelocity(),
        x: clientX,
        y: clientY,
        clientX,
        clientY,
        pageX,
        pageY,
        dX: clientX - initialX,
        dY: clientY - initialY,
        DX: Math.abs(clientX - initialX),
        DY: Math.abs(clientY - initialY),
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
        time: time,
        type: e.type
      }

      return event
    }

    function createMoveEvent(e: any): MovePointerEvent {
      const event = createEvent(e)

      const eve: MovePointerEvent = {
        ...event,
        deltaX: event.x - last.x,
        deltaY: event.y - last.y,
        deltaTime: event.time - last.time
      }

      last = eve

      return eve
    }

    last = createEvent(e)

    if (typeof cbs.start === 'function') cbs.start(last)

    const onMove = on(window, 'touchmove mousemove', e => {
      const event = createMoveEvent(e)
      if (typeof cbs.move === 'function') cbs.move(event)
    })

    const onEnd = on(window, 'touchend mouseup', e => {
      const event: MovePointerEvent = {
        ...(last as MovePointerEvent),
        type: e.type,
        preventDefault: () => e.preventDefault()
      }
      if (typeof cbs.stop === 'function') cbs.stop(event)
      onMove()
      onEnd()
    })
  })

  return onStart
}

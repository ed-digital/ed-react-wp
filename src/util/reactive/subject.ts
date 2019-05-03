const subject = Symbol('subject')

export default class Subject {
  [subject]: {
    listeners: {
      [key: string]: {
        [key: string]: (...args: any[]) => any
      }
    }
    cancels: {
      [key: string]: (...args: any[]) => any
    }
    key(): string
    index: number
  }
  constructor() {
    this[subject] = {
      index: 0,
      listeners: {},
      cancels: {},
      key() {
        return `listener_${this[subject].index++}`
      }
    }

    // Bind all the methods
    this.on = this.on.bind(this)
    this[subject].key = this[subject].key.bind(this)
    this.emit = this.emit.bind(this)
    this.once = this.once.bind(this)
    this.emitter = this.emitter.bind(this)
    this.destroy = this.destroy.bind(this)
  }

  on(name: string, fn: (...args: any) => any): () => any {
    // Every event listener is given it's own key
    const key = this[subject].key()

    const eventNames = name.split(' ')

    for (const eventName of eventNames) {
      // If this is the first listener of type eventName then listeners[eventName] will be empty
      if (!this[subject].listeners[eventName]) this[subject].listeners[eventName] = {}

      // Add the listener to the listener object
      this[subject].listeners[eventName][key] = fn
    }

    // Cancel function deletes the listener and itself from Subject
    let cancelled = false
    let cancels = () => {
      if (cancelled) return
      cancels = () => {}
      cancelled = true

      for (const eventName of eventNames) {
        delete this[subject].listeners[eventName][key]
        delete this[subject].cancels[key]

        if (!Object.keys(this[subject].listeners[eventName]).length) {
          delete this[subject].listeners[eventName]
        }
      }
    }

    // Add cancel to the subject array
    this[subject].cancels[key] = cancels

    // Return the event diposer
    return cancels
  }

  emit(name, ...args: any[]) {
    // If this even is in the listeners object
    if (this[subject].listeners[name]) {
      return Object.values(this[subject].listeners[name]).map(fn => fn(...args))
    }
  }

  once(name, fn) {
    // Use var to hoist variable (not sure if needed)
    var cancel = this.on(name, (...args) => {
      if (cancel) cancel()
      fn(...args)
    })
  }

  emitter(name) {
    return [
      name,
      (...args) => {
        this.emit(name, ...args)
      }
    ]
  }

  destroy() {
    Object.values(this[subject].cancels).forEach(fn => fn())
  }
}

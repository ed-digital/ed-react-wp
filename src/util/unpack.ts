/*
  Unpacks a data structure into a flat array, useful for useEffect and useState keys
*/

function recurse(out: any[], item: any) {
  if (Array.isArray(item)) {
    recurseArray(out, item)
  } else if (item && typeof item === 'object') {
    recurseObject(out, item)
  } else {
    out.push(item)
  }
}

function recurseArray(out: any[], arr: any[]) {
  for (let k = 0; k < arr.length; k++) {
    recurse(out, arr[k])
  }
}

function recurseObject(out: any[], obj: { [index: string]: any }) {
  for (const key in obj) {
    out.push(key)
    recurse(out, obj[key])
  }
}

export default function unpack(data: any) {
  const out: any[] = []
  recurse(out, data)
  return out
}

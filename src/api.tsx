import * as React from 'react'
// @ts-ignore: No types necessary
import 'whatwg-fetch'

type APIResult = {
  success: boolean
  data?: any
  error?: Error
}

export async function callAPI(method: string, args: any): Promise<APIResult> {
  try {
    return _callAPI(method, args)
  } catch (err) {
    return { success: false, error: err }
  }
}

async function _callAPI(method: string, args: any): Promise<APIResult> {
  const response = await fetch('/json-api/' + method, {
    method: 'post',
    body: JSON.stringify(args),
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    }
  })
  const data = await response.json()
  return {
    success: !data.error,
    data: data.result,
    error: data.error
  }
}

type UseAPICallState = 'ready' | 'loading' | 'done' | 'error'

type UseAPIResult = APIResult & {
  success: boolean
  callState: UseAPICallState
  call: (args: any) => void
}

export function useAPI(method: string, args?: any): UseAPIResult {
  const [response, setResponse] = React.useState<APIResult | null>(null)
  const [callState, setCallState] = React.useState<UseAPICallState>('ready')
  const [needsCall, setNeedsCall] = React.useState<boolean>(args !== undefined)
  const [callID, setCallID] = React.useState<number>(0)
  const [argsToSend, setArgs] = React.useState<any>(args)

  const call = (args: any) => {
    setCallID(callID + 1)
    setNeedsCall(true)
    setArgs(args)
  }

  React.useEffect(() => {
    if (needsCall) {
      let aborted = false
      setNeedsCall(false)
      setCallState('loading')
      callAPI(method, argsToSend).then(result => {
        if (aborted) return
        if (result.success) {
          setCallState('done')
        } else {
          setCallState('error')
        }
        console.log('Result', result)
        setResponse(result)
      })
      return () => {
        aborted = true
      }
    } else {
      return () => {}
    }
  }, [JSON.stringify(argsToSend), callID])

  return {
    callState: callState,
    data: response ? response.data : undefined,
    error: response ? response.error : undefined,
    success: response ? response.success : false,
    call
  }
}

import * as React from 'react'
import { callAPI } from '../api'
import styled from 'styled-components'
import { debounce } from 'throttle-debounce'

/*
  This file provides a wrapper function for simplifying block declarations
*/

type EditParams<Props> = {
  setAttributes: (attrs: { [index: string]: any }) => void
  attributes: Props
}

type BlockTypeDef<Props> = {
  title: string
  description: string
  icon: any
  category: string
  supports?: any
  attributes?: { [index: string]: any }
  component: React.ComponentType<Props>
  edit: React.ComponentType<EditParams<Props>>
}

type WPBlockTypeDef = {
  title: string
  description: string
  icon: any
  attributes?: { [index: string]: any }
  category: string
  edit: React.ComponentType<EditParams<any>>
  save: Function
  supports: {}
}

const fetchFieldValues = (vals: any, callback: (result: any) => void) => {
  let cancelled = false
  console.log('Lookup')
  callAPI('getBlockData', {
    data: vals
  }).then(result => {
    callback(result.data)
  })
  return () => (cancelled = true)
}

export function blockType<Props>(def: BlockTypeDef<Props>) {
  return (fullName: string): WPBlockTypeDef => {
    const EditComponent = def.edit
    return {
      title: def.title,
      description: def.description,
      icon: def.icon,
      category: def.category,
      attributes: {
        data: {
          type: 'object'
        },
        acfData: {
          type: 'object'
        },
        ...(def.attributes || {})
      },
      supports: def.supports || {},
      edit: props => {
        // Hack ACF into display field types
        const hackedName = 'acf/' + fullName.replace(/\//, '-')
        const acfBlock = React.useMemo(
          () =>
            window.acf.newBlock({
              clientId: String(Date.now()),
              name: hackedName,
              isValid: true,
              originalContent: '',
              attributes: {}
            }),
          []
        )

        // Debounce the ACF field lookup thing
        const getACFFieldValues = React.useMemo(() => debounce(400, false, fetchFieldValues), [])

        // When unmounting, cancel any ACF lookups in progress
        let cancelACFLookup: Function | null = null
        React.useEffect(() => () => cancelACFLookup && cancelACFLookup())

        const [acfProps, setACFProps] = React.useState<any>({})
        const [acfPropsReady, setACFPropsReady] = React.useState<boolean>(false)

        React.useEffect(() => {
          if (props.attributes.acfData) {
            cancelACFLookup = getACFFieldValues(props.attributes.acfData, result => {
              if (result) {
                setACFProps(result)
              }
              setACFPropsReady(true)
            })
          } else {
            setACFPropsReady(true)
          }
        }, [])

        return (
          <React.Fragment>
            {acfPropsReady ? (
              <EditComponent
                {...props}
                attributes={{ ...(props.attributes && props.attributes.data), ...acfProps }}
              />
            ) : (
              <Loading>Loading...</Loading>
            )}
            {/*
              Here we're rendering the ACF block, but it'll all actually be hidden
              The only thing we care about rendering is the sidebar fields!
            */}
            <span style={{ display: 'none' }}>
              {acfBlock.render({
                attributes: {
                  data: props.attributes.acfData
                },
                setAttributes: (attr: any) => {
                  if (cancelACFLookup) cancelACFLookup()
                  cancelACFLookup = getACFFieldValues(attr.data, result => {
                    if (result) {
                      setACFProps(result)
                      // props.attributes.acfData = attr.data
                      props.setAttributes({
                        acfData: attr.data
                      })
                    }
                  })
                },
                name: hackedName
              })}
            </span>
          </React.Fragment>
        )
      },
      save: () => null
    }
  }
}

const Loading = styled.div`
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 4px;
  padding: 10px 20px;
  border-radius: 7px;
  color: #888888;
`

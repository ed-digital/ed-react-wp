import * as React from 'react'
import { callAPI } from '../api'
import styled from 'styled-components'
import { debounce } from 'throttle-debounce'
import { BlockTypeDef, WPBlockTypeDef } from './type'
/*
  This file provides a wrapper function for simplifying block declarations
*/

const _getDynamicProps = (blockName: string, attributes: any, callback: (result: any) => void) => {
  let cancelled = false
  callAPI('getBlockData', {
    blockName: blockName,
    attributes: attributes
  }).then(result => {
    if (!cancelled) callback(result.data)
  })
  return () => (cancelled = true)
}

export function blockType<Props>(def: BlockTypeDef<Props>) {
  return (fullName: string, isAdmin: boolean): WPBlockTypeDef<Props> => {
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
      parent: def.parent || undefined,
      supports: def.supports || {},
      render: props => {
        return <def.component {...props} />
      },
      edit: props => {
        // Hack ACF into display field types
        const hackedName = 'acf/' + fullName.replace(/\//, '-')
        const hasACF = !!wp.blocks.getBlockType(hackedName)
        const acfBlock =
          hasACF &&
          React.useMemo(
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
        const getDynamicProps = React.useMemo(() => debounce(400, false, _getDynamicProps), [])

        // When unmounting, cancel any ACF lookups in progress
        let cancelDynamicProps: Function | null = null
        React.useEffect(() => () => cancelDynamicProps && cancelDynamicProps())

        const [dynamicProps, setDynamicProps] = React.useState<any>({})
        const [dynamicPropsReady, setDynamicPropsReady] = React.useState<boolean>(false)

        React.useEffect(() => {
          if (props.attributes.acfData) {
            cancelDynamicProps = getDynamicProps(fullName, props.attributes, result => {
              if (result) {
                setDynamicProps(result)
              }
              setDynamicPropsReady(true)
            })
          } else {
            setDynamicPropsReady(true)
          }
        }, [])

        console.log(props)

        return (
          <React.Fragment>
            {dynamicPropsReady ? (
              <EditComponent {...props} attributes={{ ...props.attributes, ...dynamicProps }} />
            ) : (
              <Loading>Loading...</Loading>
            )}
            {/*
              Here we're rendering the ACF block, but it'll all actually be hidden
              The only thing we care about rendering is the sidebar fields!
            */}
            <span style={{ display: 'none' }}>
              {acfBlock &&
                acfBlock.render({
                  attributes: {
                    data: props.attributes.acfData
                  },
                  setAttributes: (attr: any) => {
                    if (cancelDynamicProps) cancelDynamicProps()
                    cancelDynamicProps = getDynamicProps(
                      fullName,
                      {
                        ...props.attributes,
                        acfData: attr.data
                      },
                      result => {
                        if (result) {
                          setDynamicProps(result)
                          // props.attributes.acfData = attr.data
                          props.setAttributes({
                            acfData: attr.data
                          })
                        }
                      }
                    )
                  },
                  name: hackedName
                })}
            </span>
          </React.Fragment>
        )
      },
      save: () => {
        const InnerBlocks = window.wp.editor.InnerBlocks
        return (
          <span>
            <InnerBlocks.Content />
          </span>
        )
      }
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

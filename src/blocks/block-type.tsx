import * as React from 'react'
import { callAPI } from '../api'
import styled from 'styled-components'
import { BlockTypeDef, WPBlockTypeDef } from './type'
import { dump } from '../util'

interface AcfBlock {
  block: {
    attributes: { [key: string]: any }
    setAttributes: (val: { [key: string]: any }) => any
    name: string
  }
  cid: string
  data: {
    align: string
    data: { [key: string]: any }
    id: string
    mode: string
    name: string
  }
}

interface Props {
  name: string
}

function debounce(time: number, fetchFn: any) {
  let tm: any
  let isReady = true

  const timeout = async () => {
    clearTimeout(tm)
    isReady = true
    return new Promise(resolve => {
      tm = setTimeout(resolve, time)
    })
  }

  const runner = async (...args: any[]) => {
    await timeout()
    const result = await fetchFn(...args)
    if (isReady) {
      return result
    }
  }

  runner.stop = () => {
    isReady = false
    clearTimeout(tm)
  }

  return runner
}

const getDynamicProps = (blockName: any, attributes: any, fields: string[]) => {
  return new Promise(async resolve => {
    /* 
      Always stop previous getDynamicProps
      Set update object equal to the blocks name and attributes   
    */
    const serverUpdate = { blockName, attributes, fields }

    const { data } = await callAPI('getBlockData', serverUpdate)

    console.log(`data`, data, fields)

    resolve(data)
  })
}

/*
  This file provides a wrapper function for simplifying block declarations

  Block type is a function that returns another function 
  The inner function returns standard Gutenberg block
*/
export function blockType<Props>(blockDefinition: BlockTypeDef<Props>) {
  /* Test to see if a field is a custom dynamic one */
  const isDynamic = (str: string) => /acf|dynamic/.test(str)

  /* Dont overwrite default values */
  for (const key of ['data', 'acfData']) {
    if (blockDefinition.attributes && blockDefinition.attributes[key]) {
      throw new Error(
        `Attribute key: ${key}, is reserved on block definition objects, please use something else`
      )
    }
  }

  /* Pull keys that are of {type: 'acf' or 'dynamic'} */
  const dynamicFields = Object.entries(blockDefinition.attributes || {})
    .filter(([fieldName, fieldDef]) => isDynamic(fieldDef.type))
    .map(([key, _def]) => key)

  /* Normal fields that can mixed straight into the block definition */
  const vanillaFieldDefs = Object.entries(blockDefinition.attributes || {})
    .filter(([fieldName, fieldDef]) => !isDynamic(fieldDef.type))
    .reduce(
      (acc, [key, val]) => {
        acc[key] = val
        return acc
      },
      {} as { [key: string]: any }
    )

  /* Where is this function being called from? */
  return (fullName: string, isAdmin: boolean): WPBlockTypeDef<Props> => {
    /* Remove ED. keys from definition */
    const { component, edit, ...standardDefinition } = blockDefinition
    const RenderComponent = component
    const EditComponent = edit

    const GutenbergBlock: WPBlockTypeDef<Props> = {
      /* 
        Set up initial/default values
      */
      supports: {},
      parent: undefined,
      icon: '',

      /* 
        Overide the defaults
        (It wont contain the properites spread from above)
      */
      ...standardDefinition,

      /* 
        Add ED. attributes
      */
      attributes: {
        data: { type: 'string' },
        acfData: { type: 'object' },
        ...(vanillaFieldDefs || {})
      },

      /* 
        Add in render methods
          Would be interesting to only pass in edit={true/false} to the componenet instead of rendering something entirely different
          Just means the responsibility would be on the component to show Html or RichText
      */
      render: props => <RenderComponent {...props} />,
      edit: props => {
        // Hack ACF into display field types
        const hackedName = 'acf/' + fullName.replace(/\//, '-')
        const hasACF = Boolean(wp.blocks.getBlockType(hackedName))

        /* 
          getUpdate.stop()
          to stop currently running update
        */
        const getUpdate = debounce(400, getDynamicProps)

        /* 
          If the block has acf data, then setup acf blocks,
          make this happen whenever hasACF updates
        */
        const acfBlock: AcfBlock = React.useMemo(
          () =>
            hasACF &&
            window.acf.newBlock({
              clientId: String(Date.now()),
              name: hackedName,
              isValid: true,
              originalContent: '',
              attributes: {}
            }),
          [hasACF]
        )

        /* 
          When re rendering this block will call getDynamicProps
        */

        const [dynamicProps, setDynamicProps] = React.useState<any>({})
        const [dynamicPropsReady, setDynamicPropsReady] = React.useState<boolean>(false)

        // If the attributes has acfData attached
        React.useEffect(() => {
          const doEffect = async () => {
            if (props.attributes.acfData) {
              const result = await getUpdate(fullName, props.attributes, dynamicFields)

              if (result) {
                setDynamicProps(result)
              }
              setDynamicPropsReady(true)
            } else {
              setDynamicPropsReady(true)
            }
          }

          doEffect()

          // When unmounting, cancel any ACF lookups in progress
          return () => getUpdate.stop()
        }, [Object.values(acfBlock.data.data).join('|')])

        /*  */
        const attributes = { ...props.attributes, ...dynamicProps }

        return (
          <React.Fragment>
            {dynamicPropsReady ? (
              <EditComponent {...props} attributes={attributes} />
            ) : (
              <LoadingBox>Loading...</LoadingBox>
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
                  setAttributes: async (attr: any) => {
                    /* Stop previous update */
                    getUpdate.stop()

                    /* Get updated props from server */
                    const result = await getUpdate(
                      fullName,
                      {
                        ...props.attributes,
                        ...dynamicProps,
                        acfData: attr.data
                      },
                      dynamicFields
                    )

                    /* Only update if we actually have props */
                    if (result) {
                      setDynamicProps(result)
                      // props.attributes.acfData = attr.data
                      props.setAttributes({
                        acfData: attr.data
                      })
                    }
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

    return GutenbergBlock
  }
}

/* Nice looking loading box 😎 */
export const LoadingBox = styled.div`
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 4px;
  padding: 10px 20px;
  border-radius: 7px;
  color: #888888;
`

import * as React from 'react'
import { callAPI } from '../api'
import styled from 'styled-components'
import { BlockTypeDef, WPBlockTypeDef } from './type'

declare global {
  interface Window {
    wp: any
    acf: any
  }
}

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
  render: Function
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
      Get the post being currently edited
    */
    const postId = window.wp.data.select('core/editor').getEditedPostAttribute('id')

    /*
      Always stop previous getDynamicProps
      Set update object equal to the blocks name and attributes
    */
    const serverUpdate = { blockName, attributes, fields, postId }

    const { data } = await callAPI('getBlockData', serverUpdate)

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
  const isACF = (str: string) => /acf/.test(str)

  /* Dont overwrite default values */
  for (const key of ['data', 'acfData']) {
    if (blockDefinition.attributes && blockDefinition.attributes[key]) {
      throw new Error(
        `Attribute key: ${key}, is reserved on block definition objects, please use something else`
      )
    }
  }

  const userAttributeEntries = Object.entries(blockDefinition.attributes || {})

  /* Pull keys that are of {type: 'acf' or 'dynamic'} */
  const dynamicFields = userAttributeEntries
    .filter(([fieldName, fieldDef]) => isDynamic(fieldDef.type))
    .map(([key, _def]) => key)

  /* Just ACF fields. To be used when using setAttibutes, so you can actually set acf fields from your component */
  const acfFields = userAttributeEntries
    .filter(([fieldName, fieldDef]) => isACF(fieldDef.type))
    .map(([fieldName]) => fieldName)

  /* Normal fields that can mixed straight into the block definition */
  const vanillaFieldDefs = userAttributeEntries
    .filter(([fieldName, fieldDef]) => !isDynamic(fieldDef.type))
    .reduce(
      (acc, [key, val]) => {
        acc[key] = val
        return acc
      },
      {} as { [key: string]: any }
    )

  const getACFAttributes = (attrs: any) => {
    return acfFields.reduce(
      (res, field) => {
        res[field] = attrs[field]
        return res
      },
      {} as { [key: string]: any }
    )
  }

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
        const hasACF = Boolean(window.wp.blocks.getBlockType(hackedName))

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
            if (dynamicFields.length) {
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
        }, [Object.values((acfBlock && acfBlock.data && acfBlock.data.data) || {}).join('|')])

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
                    // @ts-ignore
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
                        /*
                        TODO: Trying to make it so that you can update acf fields from setAttributes (it will only update keys in acfFields)
                          Will need to figure out how to map fieldNames to fieldIDs
                        acfData: { ...getACFAttributes(props.attributes), ...attr.data }
                        */
                      },
                      dynamicFields
                    )

                    /* Only update if we actually have props */
                    if (result) {
                      setDynamicProps(result)
                      // propsetDynamicPropss.attributes.acfData = attr.data
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

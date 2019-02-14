import * as React from 'react'
import { callAPI } from '../api'
import styled from 'styled-components'
import { debounce } from 'throttle-debounce'
import { BlockTypeDef, WPBlockTypeDef } from './type'

export function overrideStandardBlock<Props>(
  generate: (existing: WPBlockTypeDef<Props & any>) => Partial<BlockTypeDef<Props>>
) {
  return {
    override: true,
    getBlock: (fullName: string, isAdmin: boolean) => {
      const existing = isAdmin ? wp.blocks.getBlockType(fullName) : {}
      if (!fullName) {
        console.error(`Cannot override block "${fullName}", as it has not been mounted.`)
        return
      }
      Object.assign(existing, generate(existing))
      return existing
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

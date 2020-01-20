import styled, { css } from '@datapunt/asc-core'
import LabelStyle from '../Label/LabelStyle'
import { themeSpacing } from '@datapunt/asc-ui'

export type Props = {
  name?: string
  horizontal?: boolean
  disabled?: boolean
  error?: boolean
}

export default styled.div<Props>`
  display: flex;
  flex-direction: ${({ horizontal }) => (horizontal ? 'row' : 'column')};
  ${({ horizontal }) =>
    horizontal &&
    css`
      ${LabelStyle} {
        margin-right: ${themeSpacing(4)};
      }
    `}
`
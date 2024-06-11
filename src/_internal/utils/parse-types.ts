import { isNumber } from 'my-gadgetry/type-check'

import { PARSE_TYPES, ParseType } from '~types/parse-types.js'

const BOOL_VALUES = Object.freeze(['Y', 'y', 'yes', 'YES', 'x', 'v', 'o', 'true'])

export const parse = (value: string, type: ParseType) => {
  switch (type) {
    case PARSE_TYPES.number:
      return isNumber(value, true) ? Number(value) : 0
    case PARSE_TYPES.confirm:
      return BOOL_VALUES.includes(value)
    default:
      return value
  }
}

export const parseView = (value: string, type: ParseType) => {
  switch (type) {
    case PARSE_TYPES.number:
      return value ? Number(value) : 0
    case PARSE_TYPES.confirm:
      return value === 'true'
    default:
      return value
  }
}

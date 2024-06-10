import { INDEX_ERRORS } from '~internal/plugins/table/types.js'

export const isNoChoiceOfIndex = (maxIndex: number, disableIndexes: number[]) => {
  return disableIndexes.length > maxIndex && [...Array(maxIndex).keys()].every(index => disableIndexes.includes(index))
}

export const gateValidateColumnIndexError = (index: number, maxIndex: number, disableIndexes: number[]) => {
  if (index > maxIndex || index < 0) {
    return INDEX_ERRORS.excess
  }
  if (disableIndexes.includes(index)) {
    return INDEX_ERRORS.disabled
  }
  return false
}

export const getNextIndex = (index: number, maxIndex: number, num: number) => {
  if (index > maxIndex) {
    return 0
  }
  if (index < 0) {
    return maxIndex
  }
  return index > maxIndex ? 0 : index + num
}

import { Key } from 'readline'

export const getKeypressValue = (key: Key) => {
  switch (key.name) {
    case 'escape':
    case 'delete':
    case 'backspace':
    case 'down':
    case 'up':
    case 'left':
    case 'right':
      return ''
    default:
      return key.sequence
  }
}

export const getBackspaceText = (str: string) => {
  if (!str) {
    return ''
  }
  return str.slice(0, -1)
}

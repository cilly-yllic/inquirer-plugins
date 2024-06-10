export const PARSE_TYPES = Object.freeze({
  input: 'input',
  number: 'number',
  confirm: 'confirm',
} as const)

export type ParseType = (typeof PARSE_TYPES)[keyof typeof PARSE_TYPES]

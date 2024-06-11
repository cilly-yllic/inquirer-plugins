import chalk, { ChalkInstance } from 'chalk'
import { Answers } from 'inquirer'

import { ParseType } from '~types/parse-types.js'
import { hop, success, warn } from '~utils/chalk.js'

export const DEFAULT_PAGE_SIZE = 5
export const INDEX_ERRORS = Object.freeze({
  excess: 'excess',
  disabled: 'disabled',
} as const)

export interface DefaultOptions extends Required<Omit<TableQuestion, 'type' | 'name' | 'colors'>> {
  colors: Colors
}

export const DEFAULT_OPTIONS: DefaultOptions = {
  message: '',
  description: '',
  escapeMessage: chalk.red('Press ESC again to exit!'),
  confirmMessage: chalk.red('Press ENTER again to confirm!'),
  disableColumnIndexes: [],
  colors: {
    selected: warn,
    editable: success,
    editing: hop,
  },
  columns: [],
  rows: [],
  pageSize: DEFAULT_PAGE_SIZE,
  validate: () => ({ isValid: true, message: '' }),
}

export interface RequiredOptions extends Required<Omit<TableQuestion, 'colors'>> {
  colors: Colors
}

export interface Colors {
  selected: ChalkInstance
  editable: ChalkInstance
  editing: ChalkInstance
}

export interface ValidateResult {
  isValid: boolean
  message: string
}

export interface TableQuestion {
  type: string
  name: string
  message?: string | ChalkInstance
  description?: string | ChalkInstance
  escapeMessage?: string | ChalkInstance
  confirmMessage?: string | ChalkInstance
  disableColumnIndexes?: number[]
  colors?: Partial<Colors>
  columns: Column[]
  rows: Cell[][]
  validate?: (...args: any[]) => ValidateResult
  pageSize?: number
}

export interface Column {
  name: string | ChalkInstance
  value: string
  type: ParseType
  validate?: (input: string, raws: RawInputs, answers: Answers) => ValidateResult
  parser?: (input: any, raws: RawInputs, answers: Answers) => any
}

export type Cell = number | string | boolean

export type RawInputs = Record<string, string>[]

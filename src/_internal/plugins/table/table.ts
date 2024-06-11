import { Answers } from 'inquirer'

import { PARSE_TYPES } from '~types/parse-types.js'
import { trim, error } from '~utils/chalk.js'
import { parse } from '~utils/parse-types.js'

import { Column, Cell, RawInputs } from './types.js'

export class TableClass {
  columns: Column[] = []
  rows: string[][] = []

  constructor(columns: Column[], rows: Cell[][]) {
    this.columns = columns
    this.rows = rows.map(columns => columns.map(value => `${value}`))
  }

  get header() {
    return this.columns.map(({ name }) => `${name}`)
  }

  getColumnType(columnIndex: number) {
    if (!(columnIndex in this.columns)) {
      return PARSE_TYPES.input
    }
    return this.columns[columnIndex].type
  }

  getParser(columnIndex: number): Exclude<Column['parser'], undefined> {
    return this.columns[columnIndex].parser || ((txt: string, _inputs: RawInputs, _answers: Answers) => txt)
  }

  getValidator(columnIndex: number): Exclude<Column['validate'], undefined> {
    return (
      this.columns[columnIndex].validate ||
      ((_txt: string, _inputs: RawInputs, _answers: Answers) => ({ isValid: true, message: '' }))
    )
  }

  updateRow(rowIndex: number, columnIndex: number, value: string, answers: Answers) {
    if (!(rowIndex in this.rows)) {
      return error(`row index (${rowIndex}) not found`)
    }
    const columns = this.rows[rowIndex]
    if (!(columnIndex in columns)) {
      return error(`column index (${columnIndex}) not found`)
    }
    const validateResult = this.getValidator(columnIndex)(value, this.getRaw(), answers)
    if (!validateResult.isValid) {
      return validateResult.message
    }
    const parser = this.getParser(columnIndex)
    const parsed = parser(value, this.getRaw(), answers)
    columns[columnIndex] = `${parsed}`
    return ''
  }

  getValue(rowIndex: number, columnIndex: number) {
    if (!(rowIndex in this.rows)) {
      return ''
    }
    const columns = this.rows[rowIndex]
    if (!(columnIndex in columns)) {
      return ''
    }
    return columns[columnIndex]
  }

  getRaw(): RawInputs {
    const result: RawInputs = []
    for (let i = 0; i < this.rows.length; i++) {
      result.push({})
      for (let ii = 0; ii < (this.rows[i] || []).length; ii++) {
        const { value: key } = this.columns[ii]
        result[i][key] = trim(this.rows[i][ii])
      }
    }
    return result
  }

  getResult(answers: Answers) {
    const result: Record<string, Cell>[] = []
    for (let i = 0; i < this.rows.length; i++) {
      result.push({})
      for (let ii = 0; ii < (this.rows[i] || []).length; ii++) {
        const { value: key, type, parser } = this.columns[ii]
        const value = trim(this.rows[i][ii])
        result[i][key] = parser ? parser(value, this.getRaw(), answers) : parse(value, type)
      }
    }
    return result
  }
}

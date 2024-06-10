import { PARSE_TYPES } from '~types/parse-types.js'
import { trim } from '~utils/chalk.js'
import { parse } from '~utils/parse-types.js'

import { Column, Cell } from './types.js'

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

  updateRow(rowIndex: number, columnIndex: number, value: string) {
    if (!(rowIndex in this.rows)) {
      return
    }
    const columns = this.rows[rowIndex]
    if (!(columnIndex in columns)) {
      return
    }
    const validate = this.columns[columnIndex].validate || (() => true)
    if (!validate(value)) {
      return
    }
    const parser = this.columns[columnIndex].parser || ((txt: string) => txt)
    const parsed = parser(value)
    columns[columnIndex] = `${parsed}`
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

  getResult() {
    const result: Record<string, Cell>[] = []
    for (let i = 0; i < this.rows.length; i++) {
      result.push({})
      for (let ii = 0; ii < (this.rows[i] || []).length; ii++) {
        const { value: key, type, parser } = this.columns[ii]
        const value = trim(this.rows[i][ii])
        result[i][key] = parser ? parser(value) : parse(value, type)
      }
    }
    return result
  }
}

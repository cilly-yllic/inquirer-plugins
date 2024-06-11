import { Interface as ReadLineInterface, Key } from 'readline'

import { ChalkInstance } from 'chalk'
import cliCursor from 'cli-cursor'
import Table from 'cli-table3'
import { Question, Answers } from 'inquirer'
import Base from 'inquirer/lib/prompts/base.js'
import observe from 'inquirer/lib/utils/events.js'
import { map } from 'rxjs/operators'

import { Done } from '~types/inquirer.js'
import { dim, error } from '~utils/chalk.js'
import { getKeypressValue, getBackspaceText } from '~utils/keypress.js'

import { TableClass } from './table/table.js'
import { DEFAULT_OPTIONS, RequiredOptions, TableQuestion } from './table/types.js'
import { isNoChoiceOfIndex, gateValidateColumnIndexError, getNextIndex } from './table/utils.js'

export class TablePlugin extends Base {
  table = new TableClass([], [])
  options!: RequiredOptions

  done!: Done

  pointerIndexes = {
    row: 0,
    column: 0,
  }
  isNextCloses = {
    escape: false,
  }
  editing = false
  temporaryBackup: string | null = null
  purTyping = ''
  answers: Answers = []

  constructor(question: Question<TableQuestion>, readLine: ReadLineInterface, answers: Answers) {
    super({ ...question, validate: () => false } as Question, readLine, answers)
    this.options = {
      ...DEFAULT_OPTIONS,
      ...(this.opt as any),
      validate: question.validate || DEFAULT_OPTIONS.validate,
    }
    this.answers = answers
    this.table = new TableClass(this.options.columns, this.options.rows)

    if (isNoChoiceOfIndex(this.maxColumnIndex, this.options.disableColumnIndexes)) {
      throw new Error('disableColumnIndexes contains all of index.')
    }
    this.pointerIndexes.row = 0
    this.updateColumnIndex(1)
  }

  getCurrentValues() {
    return this.table.getResult(this.answers)
  }

  isEditable(index: number) {
    return !this.options.disableColumnIndexes.includes(index)
  }

  _run(callback: Done) {
    this.done = callback

    const events = observe(this.rl)
    const validation = this.handleSubmitEvents(events.line.pipe(map(this.getCurrentValues.bind(this))))
    validation.success.forEach(this.onEnd.bind(this))
    validation.error.forEach(this.onError.bind(this))

    events.keypress.forEach(({ key }) => {
      if (key.name !== 'escape') {
        this.isNextCloses.escape = false
      }

      if (!this.editing) {
        switch (key.name) {
          case 'down':
            return this.onDownKey()

          case 'up':
            return this.onUpKey()

          case 'left':
            return this.onLeftKey()

          case 'right':
            return this.onRightKey()

          case 'escape':
            if (!this.isNextCloses.escape) {
              this.isNextCloses.escape = true
              return this.render()
            } else {
              this.render()
              return this.onEnd(false)
            }

          default:
            if (this.isEditable(this.pointerIndexes.column)) {
              this.editing = true
              this.clear()
              this.onEditPress(key)
            }
        }
      } else {
        return this.onEditPress(key)
      }
    })

    cliCursor.hide()
    this.render()

    return this
  }

  get maxPageIndex() {
    return this.options.pageSize - 1
  }
  get maxRowIndex() {
    return this.table.rows.length - 1
  }

  get maxColumnIndex() {
    return this.table.columns.length - 1
  }

  onDownKey() {
    if (this.pointerIndexes.row < this.maxRowIndex) {
      ++this.pointerIndexes.row
    }
    this.render()
  }
  onUpKey() {
    if (this.pointerIndexes.row > 0) {
      --this.pointerIndexes.row
    }
    this.render()
  }

  updateColumnIndex(num: number) {
    let index = this.pointerIndexes.column
    for (let c = 0; c <= this.maxColumnIndex; c++) {
      index = getNextIndex(index, this.maxColumnIndex, num)
      const error = gateValidateColumnIndexError(index, this.maxColumnIndex, this.options.disableColumnIndexes)
      if (!error) {
        break
      }
    }
    this.pointerIndexes.column = index
  }

  onLeftKey() {
    this.updateColumnIndex(-1)
    this.render()
  }

  onRightKey() {
    this.updateColumnIndex(1)
    this.render()
  }

  clear() {
    this.temporaryBackup = null
    this.purTyping = ''
  }

  onEnd(state: any) {
    this.render(true)
    this.status = 'answered'
    this.screen.done()
    cliCursor.show()
    if (state) {
      return this.done({
        state,
        result: this.getCurrentValues(),
      })
    } else {
      return this.done({
        state,
      })
    }
  }

  validate() {
    return this.options.validate(this.getCurrentValues(), this.answers)
  }

  onError(_state: any) {
    if (this.editing) {
      this.editing = false
      this.render()
    } else {
      if (this.validate().isValid) {
        return this.onEnd(true)
      } else {
        return this.render()
      }
    }
  }

  updateChoice(value: string) {
    return this.table.updateRow(this.pointerIndexes.row, this.pointerIndexes.column, value, this.answers)
  }

  get currentValue() {
    return this.table.getValue(this.pointerIndexes.row, this.pointerIndexes.column)
  }

  onEditPress(key: Key) {
    if (this.temporaryBackup === null) {
      this.temporaryBackup = this.currentValue
    }
    let value = this.purTyping
    switch (key.name) {
      case 'escape':
        this.purTyping = ''
        value = this.temporaryBackup
        this.editing = false
        break
      case 'delete':
        this.purTyping = ''
        value = this.purTyping
        break
      case 'backspace': {
        this.purTyping = getBackspaceText(this.purTyping)
        value = this.purTyping
        break
      }
      default:
        this.purTyping = `${this.purTyping}${getKeypressValue(key)}`
        value = this.purTyping
        break
    }
    const message = this.updateChoice(value)
    this.render(false, message)
  }

  getShowRowIndex() {
    const middleOfPage = Math.floor(this.options.pageSize / 2)
    let rowIndexFrom = Math.max(0, this.pointerIndexes.row - middleOfPage)
    const rowIndexTo = Math.min(this.maxRowIndex, rowIndexFrom + this.maxPageIndex)
    rowIndexFrom = Math.min(rowIndexFrom, rowIndexTo - (this.options.pageSize - 1))
    return { rowIndexFrom, rowIndexTo }
  }

  isSelected(rowIndex: number, columnIndex: number) {
    return this.pointerIndexes.row === rowIndex && this.pointerIndexes.column === columnIndex
  }
  getColor(_value: string, isSelected: boolean, isEditable: boolean) {
    const value = isEditable ? _value : dim(_value)
    if (!isSelected) {
      return value
    }
    if (this.editing) {
      return isEditable ? this.options.colors.editing(value) : this.options.colors.selected(value)
    }
    return isEditable ? this.options.colors.editable(value) : this.options.colors.selected(value)
  }

  render(isDisconnect = false, message = '') {
    let content = this.getQuestion()
    let bottomContent: string | ChalkInstance = ''

    content += this.options.description ? `\n${this.options.description}` : ''

    const { rowIndexFrom, rowIndexTo } = this.getShowRowIndex()
    const table = new Table({
      head: this.table.header,
    })
    for (let i = 0; i < this.table.rows.length; i++) {
      if (i < rowIndexFrom || i > rowIndexTo) {
        continue
      }
      const columnValues: string[] = []
      for (let ii = 0; ii < (this.table.rows[i] || []).length; ii++) {
        const isEditable = this.isEditable(ii)
        const value = this.table.rows[i][ii]
        const parser = this.table.getParser(ii)
        columnValues.push(
          this.getColor(parser(value, this.table.getRaw(), this.answers), this.isSelected(i, ii), isEditable)
        )
      }
      table.push(columnValues)
    }

    content += '\n\n' + table.toString()

    if (!isDisconnect) {
      const validateResult = this.validate()
      if (!this.editing && validateResult.isValid) {
        bottomContent = this.options.confirmMessage
      }
      if (!validateResult.isValid) {
        bottomContent = validateResult.message || error('Something went wrong.')
      }
    }
    if (this.isNextCloses.escape) {
      bottomContent = this.options.escapeMessage
    }
    if (message) {
      bottomContent = message
    }
    this.screen.render(content, bottomContent as string)
  }
}

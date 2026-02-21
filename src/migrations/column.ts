import { ColumnDefinition } from './types'

export default class Column {
  constructor(private column: ColumnDefinition) {}

  nullable() {
    this.column.nullable = true
    return this
  }

  unique() {
    this.column.unique = true
    return this
  }

  default(val: any) {
    this.column.default = val
    return this
  }

  defaultRaw(val: string) {
    this.column.raw = 'DEFAULT '+ val
    return this
  }

  raw(raw: string) {
    this.column.raw = raw
    return this
  }

  unsigned() {
    this.column.unsigned = true
    return this
  }

  index() {
    this.column.index = true
    return this
  }

  comment(text: string) {
    this.column.comment = text
    return this
  }

  primary() {
    this.column.primary = true
    return this
  }

  autoIncrement() {
    this.column.autoIncrement = true
    return this
  }
}

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

  default(value: any) {
    this.column.default = value
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

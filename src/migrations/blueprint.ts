import Column from './column'
import ForeignKey from './foreign-key'
import type {
  ColumnDefinition, IndexDefinition, ForeignKeyDefinition,
} from './types'

export class Blueprint {
  #table: string
  #columns: ColumnDefinition[] = []
  #indexes: IndexDefinition[] = []
  #foreignKeys: ForeignKeyDefinition[] = []
  #dropColumns: string[] = []
  #renameColumns: Map<string, string> = new Map()

  constructor(table: string) {
    this.#table = table
  }

  #column(definition: ColumnDefinition) {
    const column: ColumnDefinition = definition
    this.#columns.push(column)
    return new Column(column)
  }

  id(name: string = 'id') { // Auto-increment ID (bigint unsigned)
    return this.#column({ name, type: 'INTEGER', autoIncrement: true, primary: true, nullable: false })
  }

  string(name: string, length: number = 255) {
    return this.#column({ name, type: 'VARCHAR', length, nullable: false })
  }

  text(name: string) {
    return this.#column({ name, type: 'TEXT', nullable: false })
  }

  int(name: string) {
    return this.#column({ name, type: 'INTEGER', nullable: false })
  }
  integer(name: string) {
    return this.int(name)
  }
  real(name: string) {
    return this.#column({ name, type: 'REAL', nullable: false })
  }
  numeric(name: string) {
    return this.#column({ name, type: 'NUMERIC', nullable: false })
  }

  // bigInteger(name: string) {
  //   return this.#column({ name, type: 'BIGINT', nullable: false })
  // }

  // tinyInteger(name: string) {
  //   return this.#column({ name, type: 'TINYINT', nullable: false })
  // }

  boolean(name: string) {
    return this.#column({ name, type: 'INTEGER', nullable: false })
  }

  // decimal(name: string, precision: number = 8, scale: number = 2) {
  //   return this.#column({ name, type: `DECIMAL(${precision},${scale})`, nullable: false })
  // }

  // float(name: string) {
  //   return this.#column({ name, type: 'FLOAT', nullable: false })
  // }

  // double(name: string) {
  //   return this.#column({ name, type: 'DOUBLE', nullable: false })
  // }

  // date(name: string) {
  //   return this.#column({ name, type: 'DATE', nullable: false })
  // }

  // dateTime(name: string) {
  //   return this.#column({ name, type: 'DATETIME', nullable: false })
  // }

  // timestamp(name: string) {
  //   return this.#column({ name, type: 'TIMESTAMP', nullable: false })
  // }

  // time(name: string) {
  //   return this.#column({ name, type: 'TIME', nullable: false })
  // }

  json(name: string) {
    return this.#column({ name, type: 'JSON', nullable: false })
  }

  enum(name: string, values: string[]) {
    return this.#column({ name, type: `ENUM(${values.map(v => `'${v}'`).join(', ')})`, nullable: false })
  }

  blob(name: string) {
    return this.#column({ name, type: 'BLOB', nullable: false })
  }

  timestamps() {
    this.#column({ name: 'created_at', type: 'TEXT', nullable: false })
    this.#column({ name: 'updated_at', type: 'TEXT', nullable: false })
    return this
  }

  softDelete(name: string = 'deleted_at') {
    this.#column({ name, type: 'TEXT', nullable: true })
    return this
  }

  softDeletes(name: string = 'deleted_at') {
    return this.softDelete(name)
  }

  foreign(column: string) {
    const fk: ForeignKeyDefinition = { column, references: '', on: '' }
    this.#foreignKeys.push(fk)
    return new ForeignKey(fk)
  }

  index(columns: string | string[], name?: string): this {
    this.#indexes.push({
      columns: Array.isArray(columns) ? columns : [columns],
      type: 'index',
      name
    })
    return this
  }

  unique(columns: string | string[], name?: string): this {
    this.#indexes.push({
      columns: Array.isArray(columns) ? columns : [columns],
      type: 'unique',
      name
    })
    return this
  }

  primary(columns: string | string[], name?: string): this {
    this.#indexes.push({
      columns: Array.isArray(columns) ? columns : [columns],
      type: 'primary',
      name
    })
    return this
  }

  dropColumn(...name: string[] | string[][]): this {
    this.#dropColumns.push(...name.flat(Infinity) as string[])
    return this
  }

  renameColumn(from: string, to: string): this {
    this.#renameColumns.set(from, to)
    return this
  }

  get table(): string {
    return this.#table
  }

  get columns() {
    return this.#columns
  }

  get indexes() {
    return this.#indexes
  }

  get foreignKeys() {
    return this.#foreignKeys
  }

  get dropColumns() {
    return this.#dropColumns
  }

  get renameColumns() {
    return this.#renameColumns
  }
}

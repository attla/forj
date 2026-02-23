import pluralize from 'pluralize'
import Column from './column'
import ForeignKey from './foreign-key'
import { tableName } from '../utils'
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
    this.#table = tableName(table)
  }

  #column(definition: ColumnDefinition) {
    const column: ColumnDefinition = definition
    this.#columns.push(column)
    return new Column(column)
  }

  id(name: string = 'id') {
    return this.#column({ name, type: 'INTEGER', primary: true, nullable: true })
  }

  string(name: string, length: number = 0) {
    return this.#column({ name, type: 'VARCHAR', length })
  }

  text(name: string) {
    return this.#column({ name, type: 'TEXT' })
  }

  int(name: string) {
    return this.#column({ name, type: 'INTEGER' })
  }
  integer(name: string) {
    return this.int(name)
  }
  real(name: string) {
    return this.#column({ name, type: 'REAL' })
  }
  numeric(name: string) {
    return this.#column({ name, type: 'NUMERIC' })
  }

  // bigInteger(name: string) {
  //   return this.#column({ name, type: 'BIGINT' })
  // }

  // tinyInteger(name: string) {
  //   return this.#column({ name, type: 'TINYINT' })
  // }

  boolean(name: string) {
    return this.#column({ name, type: 'INTEGER' })
  }

  // decimal(name: string, precision: number = 8, scale: number = 2) {
  //   return this.#column({ name, type: `DECIMAL(${precision},${scale})` })
  // }

  // float(name: string) {
  //   return this.#column({ name, type: 'FLOAT' })
  // }

  // double(name: string) {
  //   return this.#column({ name, type: 'DOUBLE' })
  // }

  // date(name: string) {
  //   return this.#column({ name, type: 'DATE' })
  // }

  // dateTime(name: string) {
  //   return this.#column({ name, type: 'DATETIME' })
  // }

  // timestamp(name: string) {
  //   return this.#column({ name, type: 'TIMESTAMP' })
  // }

  // time(name: string) {
  //   return this.#column({ name, type: 'TIME' })
  // }

  // json(name: string) {
  //   return this.#column({ name, type: 'JSON' })
  // }

  enum(name: string, values: string[] | number[]) {
    return this.#column({
      name,
      type: values.every(v => typeof v == 'string') ? 'TEXT' : (values.every(v => Number.isInteger(v)) ? 'INTEGER' : 'REAL'),
      // TODO:
      // Checking floating-point numbers can be problematic due to the precision of REAL numbers
      // SQLite might store 0.5 as 0.4999999 or 0.5000001, causing the check to fail
      // Maybe works:
      //   rate NUMERIC(3,1) NOT NULL DEFAULT 0 CHECK(
      //     rate IN (0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5)
      //   )
      raw: `CHECK(${name} IN (${values.map(v => typeof v == 'string' ? `'${v.replace(/'/g, "\\'")}'` : v).join(', ')}))`,
    })
  }

  blob(name: string) {
    return this.#column({ name, type: 'BLOB' })
  }

  timestamps(columnType: 'int' | 'date' = 'int') {
    const isInt = columnType == 'int'
    const type = isInt ? 'INTEGER' : 'DATETIME'
    this.#column({ name: 'created_at', type, nullable: true, raw: 'DEFAULT '+ (isInt ? '(unixepoch())' : 'CURRENT_TIMESTAMP') })
    this.#column({ name: 'updated_at', type, nullable: true })
    return this
  }

  softDelete(columnType: 'int' | 'date' = 'int', name: string = 'deleted_at') {
    this.#column({ name, type: columnType == 'int' ? 'INTEGER' : 'DATETIME', nullable: true })
    return this
  }
  softDeletes(columnType: 'int' | 'date' = 'int', name: string = 'deleted_at') {
    return this.softDelete(columnType, name)
  }

  foreignId(name: string) {
    const opts = { name, type: 'INTEGER', onDelete: 'CASCADE', onUpdate: 'RESTRICT' } as ColumnDefinition
    const sufixIndex = name.lastIndexOf('_id')

    if (sufixIndex > -1)
      return this.#column({
        ...opts,
        references: name.substring(sufixIndex + 1),
        on: pluralize(name.substring(0, sufixIndex)),
      })

    return this.#column(opts)
  }

  foreign(name: string) {
    const fk: ForeignKeyDefinition = { name, references: '', on: '' }
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

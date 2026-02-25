
import { Blueprint } from './blueprint'
import Builder from './builder'

import type {
  BlueprintFn,
  // SchemaConnection,
} from './types'

export class Schema {
  // static #c: SchemaConnection | null = null
  static #statements: string[] = []
  static #foreignKeyConstraintsEnabled = true

  // static setConnection(connection: SchemaConnection) {
  //   this.#c = connection
  //   return this
  // }

  static get statements() {
    return this.#statements
  }

  static clearStatements() {
    this.#statements = []
    return this
  }

  static #addStatement(...sql: string[] | string[][]) {
    this.#statements.push(...sql.flat(Infinity) as string[])
  }

  // mudei tudo this.#executeSql -> this.#addStatement
  // static #executeSql(...sql: string[] | string[][]) {
  //   sql = sql.flat(Infinity) as string[]
  //   // if (this.#c) {
  //   //   for (const statement of sql) {
  //   //     await this.#c.execute(statement)
  //   //   }
  //   // }
  //   this.#addStatement(...sql)
  // }

  static #blueprint(table: string, ...fns: BlueprintFn[]) {
    const blueprint = new Blueprint(table)
    fns.flatMap(fn => fn && fn(blueprint))
    return blueprint
  }

  static create(table: string, fn: BlueprintFn, exist: boolean = false) {
    this.#addStatement(Builder.create(this.#blueprint(table, fn), exist))
  }

  static createIfNotExists(table: string, fn: BlueprintFn) {
    this.create(table, fn, true)
  }

  static createPivot(table: string, fn: BlueprintFn): void
  static createPivot(table: string, columns: string[], fn: BlueprintFn): void
  static createPivot(table: string, columns: string[] | BlueprintFn, fn?: BlueprintFn) {
    const hasColumn = Array.isArray(columns)
    columns = hasColumn ? columns as string[] : [] // @ts-ignore
    fn = hasColumn ? fn : columns

    this.#addStatement(Builder.create(this.#blueprint(table, fn as BlueprintFn, (table: Blueprint) => {
      columns.forEach(column => table.foreignId(column))
      table.primary(table.columns.map(c => c.name))
    })).slice(0, -1) + ' WITHOUT ROWID;')
  }

  static table(table: string, fn: BlueprintFn) {
    this.#addStatement(Builder.alter(this.#blueprint(table, fn)))
  }

  static drop(table: string) {
    this.#addStatement(Builder.drop(table))
  }

  static dropIfExists(table: string) {
    this.#addStatement(Builder.dropIfExists(table))
  }

  static rename(from: string, to: string) {
    this.#addStatement(Builder.rename(from, to))
  }

  static dropView(view: string) {
    this.#addStatement(Builder.dropView(view))
  }

  static dropViewIfExists(view: string) {
    this.#addStatement(Builder.dropViewIfExists(view))
  }

  static disableForeignKeyConstraints() {
    this.#foreignKeyConstraintsEnabled = false
    this.#addStatement('PRAGMA foreign_keys = OFF;')
  }

  static enableForeignKeyConstraints() {
    this.#foreignKeyConstraintsEnabled = true
    this.#addStatement('PRAGMA foreign_keys = ON;')
  }

  static isForeignKeyConstraintsEnabled(): boolean {
    return this.#foreignKeyConstraintsEnabled
  }

  static get sql() {
    return this.#statements.join('\n\n')
  }
  static get raw() {
    return this.sql
  }

  // static dropAllTables() {
  //   const tables = await this.getAllTables()
  //   const sql = Builder.dropAllTables(tables)
  //   this.#addStatement(sql)
  // }

  // static hasTable(table: string): Promise<boolean> {
  //   if (!this.#c)
  //     throw new Error('Database connection not set')

  //   const sql = Builder.hasTable(table)
  //   const result = await this.#c.query(sql)
  //   return result.length > 0
  // }

  // static hasColumn(table: string, columnName: string): Promise<boolean> {
  //   if (!this.#c)
  //     throw new Error('Database connection not set')

  //   const sql = Builder.hasColumn(table, columnName)
  //   const result = await this.#c.query(sql)
  //   return result.some((row: any) => row.name === columnName)
  // }

  // static hasColumns(table: string, ...columnNames: string[]): Promise<boolean> {
  //   if (!this.#c)
  //     throw new Error('Database connection not set')

  //   const sql = Builder.hasColumn(table, '')
  //   const result = await this.#c.query(sql)
  //   const existingColumns = result.map((row: any) => row.name)

  //   return columnNames.every(col => existingColumns.includes(col))
  // }

  // static getAllTables(): Promise<string[]> {
  //   if (!this.#c)
  //     throw new Error('Database connection not set')

  //   const sql = Builder.getAllTables()
  //   const result = await this.#c.query(sql)
  //   return result.map((row: any) => row.name)
  // }

  // static getColumns(table: string): Promise<any[]> {
  //   if (!this.#c)
  //     throw new Error('Database connection not set')

  //   const sql = Builder.getColumns(table)
  //   return await this.#c.query(sql)
  // }

  // static getColumnType(table: string, columnName: string): Promise<string | null> {
  //   if (!this.#c) {
  //     throw new Error('Database connection not set')
  //   }

  //   const sql = Builder.getColumns(table)
  //   const result = await this.#c.query(sql)
  //   const column = result.find((row: any) => row.name === columnName)
  //   return column ? column.type : null
  // }
}

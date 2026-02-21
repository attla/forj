
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
  // static async #executeSql(...sql: string[] | string[][]): Promise<void> {
  //   sql = sql.flat(Infinity) as string[]
  //   // if (this.#c) {
  //   //   for (const statement of sql) {
  //   //     await this.#c.execute(statement)
  //   //   }
  //   // }
  //   this.#addStatement(...sql)
  // }

  static async create(table: string, fn: BlueprintFn, exist: boolean = false): Promise<void> {
    const blueprint = new Blueprint(table)
    fn(blueprint)
    await this.#addStatement(Builder.create(blueprint, exist))
  }

  static async createIfNotExists(table: string, fn: BlueprintFn): Promise<void> {
    this.create(table, fn, true)
  }

  static async table(table: string, fn: BlueprintFn): Promise<void> {
    const blueprint = new Blueprint(table)
    fn(blueprint)
    await this.#addStatement(Builder.alter(blueprint))
  }

  static async drop(table: string): Promise<void> {
    await this.#addStatement(Builder.drop(table))
  }

  static async dropIfExists(table: string): Promise<void> {
    await this.#addStatement(Builder.dropIfExists(table))
  }

  static async rename(from: string, to: string): Promise<void> {
    await this.#addStatement(Builder.rename(from, to))
  }

  static async dropView(view: string): Promise<void> {
    await this.#addStatement(Builder.dropView(view))
  }

  static async dropViewIfExists(view: string): Promise<void> {
    await this.#addStatement(Builder.dropViewIfExists(view))
  }

  static async disableForeignKeyConstraints(): Promise<void> {
    this.#foreignKeyConstraintsEnabled = false
    await this.#addStatement('PRAGMA foreign_keys = OFF;')
  }

  static async enableForeignKeyConstraints(): Promise<void> {
    this.#foreignKeyConstraintsEnabled = true
    await this.#addStatement('PRAGMA foreign_keys = ON;')
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

  // static async dropAllTables(): Promise<void> {
  //   const tables = await this.getAllTables()
  //   const sql = Builder.dropAllTables(tables)
  //   await this.#addStatement(sql)
  // }

  // static async hasTable(table: string): Promise<boolean> {
  //   if (!this.#c)
  //     throw new Error('Database connection not set')

  //   const sql = Builder.hasTable(table)
  //   const result = await this.#c.query(sql)
  //   return result.length > 0
  // }

  // static async hasColumn(table: string, columnName: string): Promise<boolean> {
  //   if (!this.#c)
  //     throw new Error('Database connection not set')

  //   const sql = Builder.hasColumn(table, columnName)
  //   const result = await this.#c.query(sql)
  //   return result.some((row: any) => row.name === columnName)
  // }

  // static async hasColumns(table: string, ...columnNames: string[]): Promise<boolean> {
  //   if (!this.#c)
  //     throw new Error('Database connection not set')

  //   const sql = Builder.hasColumn(table, '')
  //   const result = await this.#c.query(sql)
  //   const existingColumns = result.map((row: any) => row.name)

  //   return columnNames.every(col => existingColumns.includes(col))
  // }

  // static async getAllTables(): Promise<string[]> {
  //   if (!this.#c)
  //     throw new Error('Database connection not set')

  //   const sql = Builder.getAllTables()
  //   const result = await this.#c.query(sql)
  //   return result.map((row: any) => row.name)
  // }

  // static async getColumns(table: string): Promise<any[]> {
  //   if (!this.#c)
  //     throw new Error('Database connection not set')

  //   const sql = Builder.getColumns(table)
  //   return await this.#c.query(sql)
  // }

  // static async getColumnType(table: string, columnName: string): Promise<string | null> {
  //   if (!this.#c) {
  //     throw new Error('Database connection not set')
  //   }

  //   const sql = Builder.getColumns(table)
  //   const result = await this.#c.query(sql)
  //   const column = result.find((row: any) => row.name === columnName)
  //   return column ? column.type : null
  // }
}

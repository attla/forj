
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

  static async create(tableName: string, fn: BlueprintFn): Promise<void> {
    const blueprint = new Blueprint(tableName)
    fn(blueprint)
    await this.#addStatement(Builder.create(blueprint))
  }

  static async table(tableName: string, fn: BlueprintFn): Promise<void> {
    const blueprint = new Blueprint(tableName)
    fn(blueprint)
    await this.#addStatement(Builder.alter(blueprint))
  }

  static async drop(tableName: string): Promise<void> {
    await this.#addStatement(Builder.drop(tableName))
  }

  static async dropIfExists(tableName: string): Promise<void> {
    await this.#addStatement(Builder.dropIfExists(tableName))
  }

  static async rename(from: string, to: string): Promise<void> {
    await this.#addStatement(Builder.rename(from, to))
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

  // static async hasTable(tableName: string): Promise<boolean> {
  //   if (!this.#c)
  //     throw new Error('Database connection not set')

  //   const sql = Builder.hasTable(tableName)
  //   const result = await this.#c.query(sql)
  //   return result.length > 0
  // }

  // static async hasColumn(tableName: string, columnName: string): Promise<boolean> {
  //   if (!this.#c)
  //     throw new Error('Database connection not set')

  //   const sql = Builder.hasColumn(tableName, columnName)
  //   const result = await this.#c.query(sql)
  //   return result.some((row: any) => row.name === columnName)
  // }

  // static async hasColumns(tableName: string, ...columnNames: string[]): Promise<boolean> {
  //   if (!this.#c)
  //     throw new Error('Database connection not set')

  //   const sql = Builder.hasColumn(tableName, '')
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

  // static async getColumns(tableName: string): Promise<any[]> {
  //   if (!this.#c)
  //     throw new Error('Database connection not set')

  //   const sql = Builder.getColumns(tableName)
  //   return await this.#c.query(sql)
  // }

  // static async getColumnType(tableName: string, columnName: string): Promise<string | null> {
  //   if (!this.#c) {
  //     throw new Error('Database connection not set')
  //   }

  //   const sql = Builder.getColumns(tableName)
  //   const result = await this.#c.query(sql)
  //   const column = result.find((row: any) => row.name === columnName)
  //   return column ? column.type : null
  // }
}

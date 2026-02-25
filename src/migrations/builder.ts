import { Blueprint } from './blueprint'
import { sqlName, tableSlug } from '../utils'
import type { ColumnDefinition, IndexDefinition, ForeignKeyDefinition } from './types'

export default class SchemaBuilder {
  static create(blueprint: Blueprint, exist: boolean = false): string {
    const table = sqlName(blueprint.table)
    const columns = blueprint.columns
    const indexes = blueprint.indexes
    const foreignKeys = blueprint.foreignKeys

    const columnDefinitions = columns.map(col => this.#column(col))
    const indexDefinitions = indexes.map(idx => this.#index(idx, table))
    const foreignKeyDefinitions = foreignKeys.map(fk => this.#foreignKey(fk))

    const allDefinitions = [
      ...columnDefinitions,
      ...indexDefinitions,
      ...foreignKeyDefinitions
    ].filter(Boolean)

    return `CREATE TABLE ${exist ? 'IF NOT EXISTS ' : ''}${table} (\n  ${allDefinitions.join(',\n  ')}\n);`
  }

  static alter(blueprint: Blueprint): string[] {
    const table = sqlName(blueprint.table)
    const statements: string[] = []

    const columns = blueprint.columns
    if (columns.length > 0)
      columns.forEach(col => statements.push(`ALTER TABLE ${table} ADD COLUMN ${this.#column(col)};`))

    const dropColumns = blueprint.dropColumns
    dropColumns.forEach(col => statements.push(`ALTER TABLE ${table} DROP COLUMN ${sqlName(col)};`))

    const renameColumns = blueprint.renameColumns
    renameColumns.forEach((newName, oldName) => statements.push(`ALTER TABLE ${table} RENAME COLUMN ${sqlName(oldName)} TO ${sqlName(newName)};`))

    const indexes = blueprint.indexes
    indexes.forEach(idx => {
      const indexSql = this.#indexStatement(idx, table)
      if (indexSql) statements.push(indexSql)
    })

    const foreignKeys = blueprint.foreignKeys
    foreignKeys.forEach(fk => statements.push(`ALTER TABLE ${table} ADD ${this.#foreignKey(fk)};`))

    return statements
  }

  static #column(column: ColumnDefinition) {
    let sql = `${sqlName(column.name)} ${column.type}`

    if (column.length && !column.type.includes('('))
      sql += `(${column.length})`

    if (column.primary)
      sql += ' PRIMARY KEY'

    if (column.autoIncrement)
      sql += ' AUTOINCREMENT'

    // if (column.unsigned)
    //   sql += ' UNSIGNED'

    if (!column.nullable)
      sql += ' NOT NULL'

    if (column.default !== undefined) {
      sql += ' DEFAULT '
      if (column.default === null) {
        sql += 'NULL'
      } else {
        const type = typeof column.default
        if (type == 'string') {
          sql += `'${column.default.replace(/'/g, "\\'")}'`
        } else if (type == 'boolean') {
          sql += Number(column.default)
        } else {
          sql += `${column.default}`.replace(/''/g, "'\\'")
        }
      }
    }

    if (column.unique)
      sql += ' UNIQUE'

    if (column.raw)
      sql += ' '+ column.raw

    if (column.references && column.on)
      sql += this.#foreignKey(column, true)

    // if (column.comment)
    //   sql += ` COMMENT '${column.comment.replace(/'/g, "''")}'`

    return sql
  }

  static #index(index: IndexDefinition, table: string): string {
    const indexName = index.name || tableSlug(table) +`_${index.columns.join('_')}_${index.type}`
    const columns = index.columns.map(column => sqlName(column)).join(', ')
    table = sqlName(table)

    switch (index.type) {
      case 'primary':
        return `PRIMARY KEY (${columns})`
      case 'unique':
        return `UNIQUE KEY ${indexName} (${columns})`
      case 'index':
        return `KEY ${indexName} (${columns})`
      default:
        return ''
    }
  }

  static #indexStatement(index: IndexDefinition, table: string): string {
    const indexName = index.name || tableSlug(table) +`_${index.columns.join('_')}_${index.type}`
    const columns = index.columns.map(column => sqlName(column)).join(', ')
    table = sqlName(table)

    switch (index.type) {
      case 'primary':
        return `ALTER TABLE ${table} ADD PRIMARY KEY (${columns});`
      case 'unique':
        return `CREATE UNIQUE INDEX ${indexName} ON ${table} (${columns});`
      case 'index':
        return `CREATE INDEX ${indexName} ON ${table} (${columns});`
      default:
        return ''
    }
  }

  static #foreignKey(fk: ColumnDefinition | ForeignKeyDefinition, column: boolean = false): string {
    let sql = (column ? '' : `FOREIGN KEY (${sqlName(fk.name)})`) +` REFERENCES ${sqlName(fk.on)}(${sqlName(fk.references)})`

    if (fk.onDelete)
      sql += ` ON DELETE ${fk.onDelete.toUpperCase()}`

    if (fk.onUpdate)
      sql += ` ON UPDATE ${fk.onUpdate.toUpperCase()}`

    return sql
  }

  static drop(table: string, exist: boolean = false) {
    return `DROP TABLE ${exist ? 'IF EXISTS ' : ''}${sqlName(table)};`
  }

  static dropIfExists(table: string) {
    return this.drop(table, true)
  }

  static dropView(view: string, exist: boolean = false) {
    return `DROP VIEW ${exist ? 'IF EXISTS ' : ''}[${sqlName(view)}];`
  }

  static dropViewIfExists(view: string) {
    return this.dropView(view, true)
  }

  static rename(from: string, to: string) {
    return `ALTER TABLE ${sqlName(from)} RENAME TO ${sqlName(to)};`
  }

  static hasTable(table: string) {
    return `SELECT name FROM sqlite_master WHERE type='table' AND name='${sqlName(table)}';`
  }

  static hasColumn(table: string, columnName: string) { // TODO refactor..
    return `PRAGMA table_info(${sqlName(table)});`
  }

  static getAllTables() {
    return `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`
  }

  static getColumns(table: string): string {
    return `PRAGMA table_info(${sqlName(table)});`
  }

  static dropAllTables(tables: string[]) {
    return tables.map(table => `DROP TABLE IF EXISTS ${sqlName(table)};`)
  }
}

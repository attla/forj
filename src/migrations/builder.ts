import { Blueprint } from './blueprint'
import type { ColumnDefinition, IndexDefinition, ForeignKeyDefinition } from './types'

export default class SchemaBuilder {
  static create(blueprint: Blueprint): string {
    const tableName = blueprint.table
    const columns = blueprint.columns
    const indexes = blueprint.indexes
    const foreignKeys = blueprint.foreignKeys

    const columnDefinitions = columns.map(col => this.#column(col))
    const indexDefinitions = indexes.map(idx => this.#index(idx, tableName))
    const foreignKeyDefinitions = foreignKeys.map(fk => this.#foreignKey(fk))

    const allDefinitions = [
      ...columnDefinitions,
      ...indexDefinitions,
      ...foreignKeyDefinitions
    ].filter(Boolean)

    return `CREATE TABLE ${tableName} (\n  ${allDefinitions.join(',\n  ')}\n);`
  }

  static alter(blueprint: Blueprint): string[] {
    const tableName = blueprint.table
    const statements: string[] = []

    const columns = blueprint.columns
    if (columns.length > 0)
      columns.forEach(col => statements.push(`ALTER TABLE ${tableName} ADD COLUMN ${this.#column(col)};`))

    const dropColumns = blueprint.dropColumns
    dropColumns.forEach(col => statements.push(`ALTER TABLE ${tableName} DROP COLUMN ${col};`))

    const renameColumns = blueprint.renameColumns
    renameColumns.forEach((newName, oldName) => statements.push(`ALTER TABLE ${tableName} RENAME COLUMN ${oldName} TO ${newName};`))

    const indexes = blueprint.indexes
    indexes.forEach(idx => {
      const indexSql = this.#indexStatement(idx, tableName)
      if (indexSql) statements.push(indexSql)
    })

    const foreignKeys = blueprint.foreignKeys
    foreignKeys.forEach(fk => statements.push(`ALTER TABLE ${tableName} ADD ${this.#foreignKey(fk)};`))

    return statements
  }

  static #column(column: ColumnDefinition) {
    let sql = `${column.name} ${column.type}`

    if (column.length && !column.type.includes('('))
      sql += `(${column.length})`

    if (column.primary)
      sql += ' PRIMARY KEY'

    if (column.autoIncrement)
      sql += ' AUTOINCREMENT'

    // if (column.unsigned)
    //   sql += ' UNSIGNED'

    if (column.nullable) {
      sql += ' NULL'
    } else {
      sql += ' NOT NULL'
    }

    if (column.default !== undefined) {
      if (column.default === null) {
        sql += ' DEFAULT NULL'
      } else if (typeof column.default === 'string') {
        sql += ` DEFAULT '${column.default}'`
      } else if (typeof column.default === 'boolean') {
        sql += ` DEFAULT ${column.default ? 1 : 0}`
      } else {
        sql += ` DEFAULT ${column.default}`
      }
    }

    if (column.unique)
      sql += ' UNIQUE'

    // if (column.comment)
    //   sql += ` COMMENT '${column.comment.replace(/'/g, "''")}'`

    return sql
  }

  static #index(index: IndexDefinition, tableName: string): string {
    const indexName = index.name || `${tableName}_${index.columns.join('_')}_${index.type}`
    const columns = index.columns.join(', ')

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

  static #indexStatement(index: IndexDefinition, tableName: string): string {
    const indexName = index.name || `${tableName}_${index.columns.join('_')}_${index.type}`
    const columns = index.columns.join(', ')

    switch (index.type) {
      case 'primary':
        return `ALTER TABLE ${tableName} ADD PRIMARY KEY (${columns});`
      case 'unique':
        return `CREATE UNIQUE INDEX ${indexName} ON ${tableName} (${columns});`
      case 'index':
        return `CREATE INDEX ${indexName} ON ${tableName} (${columns});`
      default:
        return ''
    }
  }

  static #foreignKey(fk: ForeignKeyDefinition): string {
    let sql = `FOREIGN KEY (${fk.column}) REFERENCES ${fk.on}(${fk.references})`

    if (fk.onDelete)
      sql += ` ON DELETE ${fk.onDelete.toUpperCase()}`

    if (fk.onUpdate)
      sql += ` ON UPDATE ${fk.onUpdate.toUpperCase()}`

    return sql
  }

  static drop(tableName: string) {
    return `DROP TABLE ${tableName};`
  }

  static dropIfExists(tableName: string) {
    return `DROP TABLE IF EXISTS ${tableName};`
  }

  static rename(from: string, to: string) {
    return `ALTER TABLE ${from} RENAME TO ${to};`
  }

  static hasTable(tableName: string) {
    return `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`
  }

  static hasColumn(tableName: string, columnName: string) { // TODO refactor..
    return `PRAGMA table_info(${tableName});`
  }

  static getAllTables() {
    return `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`
  }

  static getColumns(tableName: string): string {
    return `PRAGMA table_info(${tableName});`
  }

  static dropAllTables(tables: string[]) {
    return tables.map(table => `DROP TABLE IF EXISTS ${table};`)
  }
}

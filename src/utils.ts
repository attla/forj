import pluralize from 'pluralize'
import type * as z from 'zod'
import type { DBSchema } from './types'

export const types = {
  SELECT: 1,
  INSERT: 2,
  UPDATE: 3,
  DELETE: 4,
} as const

const operators = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'NOT IN', 'IS', 'IS NOT', 'BETWEEN']

export function isOperator(o: any) {
  return typeof o == 'string' && operators.includes(o)
}

export function parseSelectColumn(
  col: string,
  baseTable: string,
  hasJoin: boolean
): string {
  if (col.toLowerCase().includes(' as '))
    return col

  const explicit = col.includes('.')
  if (!hasJoin && !explicit)
    return col

  const [table, column] = explicit ? col.split('.') : [baseTable, col]
  if (column == '*') return col

  return `${table}.${column} AS ${pluralize(table, 1)}_${column}`
}

export function parseColumn(name: string, table: string, hasJoin: boolean = true) {
  return !hasJoin || name.includes('.')
    ? name.split('.').map(col => sqlName(col)).join('.')
    : sqlName(table) + '.' + sqlName(name)
}

export function formatValue(value: any): string {
  if (value == null || value == undefined)
    return 'NULL'

  const type = typeof value
  if (type == 'number' || type == 'bigint')
    return String(value)

  if (type == 'boolean')
    return value ? '1' : '0'

  if (value instanceof Date)
    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`

  return `'${String(value).replace(/'/g, "''")}'`
}

const zodTypeMap: Record<string, string> = {
  ZodString: 'string',
  ZodNumber: 'number',
  ZodBoolean: 'boolean',
  ZodObject: 'object',
  ZodArray: 'array',
  ZodDate: 'object',
  ZodNull: 'object',
  ZodUndefined: 'undefined',
  ZodSymbol: 'symbol',
  ZodBigInt: 'bigint',
  ZodFunction: 'function',
}

export const isZod = (obj: any): obj is z.ZodTypeAny => obj && typeof obj == 'object' && '_def' in obj

const getDef = (schema: any) => schema?._def ?? schema?.def ?? {}

const getTypeName = (def: any): string => {
  if (!def) return ''
  if (def.typeName) return def.typeName // zod v3
  if (def.type) { // zod v4
    if (typeof def.type == 'string') {
      if (def.type.startsWith('Zod')) return def.type
      return 'Zod'+ def.type[0].toUpperCase() + def.type.slice(1)
      // return zodTypeMap[def.type] || def.type
    }

    if (def.type?.name) return def.type.name
  }

  return ''
}

const unwrap = (schema: any): any => {
  let current = schema
  let allowNull = false
  let allowUndefined = false

  while (current?._def || current?.def) {
    const def = current._def || current?.def
    const type = getTypeName(def)

    if (type == 'ZodNullable')
      allowNull = true

    if (type == 'ZodOptional' || type == 'ZodDefault')
      allowUndefined = true

    if (['ZodOptional', 'ZodNullable', 'ZodDefault', 'ZodReadonly'].includes(type)) {
      current = def.innerType
      continue
    }

    if (type == 'ZodEffects' || type == 'ZodPipeline') {
      current = def.schema || def.innerType || def.out
      continue
    }

    break
  }

  return { schema: current, allowNull, allowUndefined }
  // return current
}

export const zHas = (key: string, schema?: any): boolean => {
  if (!schema || typeof schema != 'object' || Array.isArray(schema))
    return false

  const keys = key.split('.')

  for (const k of keys) {
    schema = unwrap(schema).schema

    if (!schema || typeof schema != 'object')
      return false

    if (schema.shape && k in schema.shape) {
      schema = schema.shape[k]
    } else if (k in schema) {
      schema = schema[k]
    } else {
      return false
    }
  }

  return true
}

export const zGet = (key: string, schema?: any): [string, z.ZodTypeAny] | false => {
  const keys = key.split('.')

  for (const k of keys) {
    schema = unwrap(schema).schema

    if (typeof schema != 'object') return false

    if (schema?.shape && k in schema.shape) {
      schema = schema.shape[k]
      continue
    }

    if (k in schema) {
      schema = schema[k]
      continue
    }

    return false
  }

  return [keys[keys.length - 1], schema]
}

export const zType = (key: string, schema?: any): string => {
  const result = zGet(key, schema)
  if (!result)
    return 'unknown'

  const type = getTypeName(getDef(unwrap(result[1]).schema))
  if (!type)
    return 'unknown'

  return type.replace('Zod', '').toLowerCase()
}

export const zSame = (key: string, val: any, schema?: any, deep: boolean = false): boolean => {
  if (!deep) {
    const result = zGet(key, schema)
    if (!result) return false
    schema = result[1]
  }

  const _schema = unwrap(schema)

  if (val === undefined) return _schema.allowUndefined
  if (val === null) return _schema.allowNull

  const def = getDef(_schema.schema)
  if (!def) return false

  const type = getTypeName(def)

  if (!type) return false

  if (type == 'ZodUnion' && def.options)
    return def.options.some((z: any) => zSame(key, val, z, true))

  if (type == 'ZodArray')
    return Array.isArray(val)

  if (type == 'ZodObject')
    return typeof val == 'object' && val != null && !Array.isArray(val)

  if (type == 'ZodDate')
    return val instanceof Date

  return typeof val == zodTypeMap[type]
}

export function isJoinCompare(val: any, schema?: DBSchema) {
  if (typeof val != 'string' || !val?.includes('.'))
    return false

  if (!schema)
    return true

  const keys = zGet(val.replace(/"/g, ''), schema)
  // const keys = zGet(val, schema)
  return keys && keys?.length
}

// List taken from `aKeywordTable` in https://github.com/sqlite/sqlite/blob/378bf82e2bc09734b8c5869f9b148efe37d29527/tool/mkkeywordhash.c#L172
// prettier-ignore
export const SQLITE_KEYWORDS = new Set([
  'ABORT', 'ACTION', 'ADD', 'AFTER', 'ALL', 'ALTER', 'ALWAYS', 'ANALYZE', 'AND', 'AS', 'ASC',
  'ATTACH', 'AUTOINCREMENT', 'BEFORE', 'BEGIN', 'BETWEEN', 'BY', 'CASCADE', 'CASE', 'CAST',
  'CHECK', 'COLLATE', 'COLUMN', 'COMMIT', 'CONFLICT', 'CONSTRAINT', 'CREATE', 'CROSS', 'CURRENT',
  'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'DATABASE', 'DEFAULT', 'DEFERRED',
  'DEFERRABLE', 'DELETE', 'DESC', 'DETACH', 'DISTINCT', 'DO', 'DROP', 'END', 'EACH', 'ELSE',
  'ESCAPE', 'EXCEPT', 'EXCLUSIVE', 'EXCLUDE', 'EXISTS', 'EXPLAIN', 'FAIL', 'FILTER', 'FIRST',
  'FOLLOWING', 'FOR', 'FOREIGN', 'FROM', 'FULL', 'GENERATED', 'GLOB', 'GROUP', 'GROUPS', 'HAVING',
  'IF', 'IGNORE', 'IMMEDIATE', 'IN', 'INDEX', 'INDEXED', 'INITIALLY', 'INNER', 'INSERT', 'INSTEAD',
  'INTERSECT', 'INTO', 'IS', 'ISNULL', 'JOIN', 'KEY', 'LAST', 'LEFT', 'LIKE', 'LIMIT', 'MATCH',
  'MATERIALIZED', 'NATURAL', 'NO', 'NOT', 'NOTHING', 'NOTNULL', 'NULL', 'NULLS', 'OF', 'OFFSET',
  'ON', 'OR', 'ORDER', 'OTHERS', 'OUTER', 'OVER', 'PARTITION', 'PLAN', 'PRAGMA', 'PRECEDING',
  'PRIMARY', 'QUERY', 'RAISE', 'RANGE', 'RECURSIVE', 'REFERENCES', 'REGEXP', 'REINDEX', 'RELEASE',
  'RENAME', 'REPLACE', 'RESTRICT', 'RETURNING', 'RIGHT', 'ROLLBACK', 'ROW', 'ROWS', 'SAVEPOINT',
  'SELECT', 'SET', 'TABLE', 'TEMP', 'TEMPORARY', 'THEN', 'TIES', 'TO', 'TRANSACTION', 'TRIGGER',
  'UNBOUNDED', 'UNION', 'UNIQUE', 'UPDATE', 'USING', 'VACUUM', 'VALUES', 'VIEW', 'VIRTUAL', 'WHEN',
  'WHERE', 'WINDOW', 'WITH', 'WITHOUT',
])

export function sqlName(name?: string) {
	return !name
		|| !name.match(/^[a-zA-Z_]/)
		|| name.match(/\W/)
		|| SQLITE_KEYWORDS.has(name.toUpperCase())
		? `"${name}"`
		: name
}

export function tableSlug(name: string) {
  return name.trim()
    .replace(/([A-Z])/g, '_$1')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .toLowerCase()
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

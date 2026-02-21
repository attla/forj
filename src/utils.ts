import pluralize from 'pluralize'
import type { ZodTypeAny } from 'zod'
import type { DBSchema } from './types'

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
  return `${table}.${column} AS ${pluralize(table, 1)}_${column}`
}

export function parseColumn(name: string, table: string, hasJoin: boolean = true) {
  return !hasJoin || name.includes('.') ? name : table +'.'+ name
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
  'ZodString': 'string',
  'ZodNumber': 'number',
  'ZodBoolean': 'boolean',
  'ZodObject': 'object',
  'ZodArray': 'array',
  'ZodDate': 'object',
  'ZodNull': 'object',
  'ZodUndefined': 'undefined',
  'ZodSymbol': 'symbol',
  'ZodBigInt': 'bigint',
  'ZodFunction': 'function',
}

export const isZod = (obj: any): obj is ZodTypeAny => obj && typeof obj == 'object' && '_def' in obj

export const zHas = (key: string, schema?: any) => schema != null && typeof schema == 'object' && !Array.isArray(schema) && (key in schema || 'shape' in schema && key in (schema.shape as Record<string, ZodTypeAny>))

export const zGet = (key: string, schema?: any): [string, ZodTypeAny] | false => {
  const keys = key.split('.')
  for (const i in keys) {
    if (typeof schema != 'object') return false

    const k = keys[i]
    if ('shape' in schema && k in schema.shape) {
      schema = schema.shape[k]
      continue
    } else if (k in schema) {
      schema = schema[k]
      continue
    }

    return false
  }

  return [keys[keys.length - 1], schema]
}

export const zType = (key: string, schema?: any): string => {
  const _ = zGet(key, schema)
  if (!_ || !('_def' in _[1]))
    return 'unknown'
  key = _[0]
  schema = _[1]

  return ((schema?._def?.innerType?._def || schema?._def)?.typeName || '').split('Zod').pop().toLowerCase()
}

export const zSame = (key: string, val: any, schema?: any, deep: boolean = false): boolean => {
  if (!deep) {
    const _ = zGet(key, schema)
    if (!_) return _
    key = _[0]
    schema = _[1]
  }

  if (!('_def' in schema))
    return false // typeof val == typeof schema[key] // TODO: improv it

  let def = schema?._def || {}
  if (schema?._def?.typeName == 'ZodOptional')
    def = def?.innerType?._def || {}

  const zType = def?.typeName || ''

  if (!zType) return false

  if (zType == 'ZodUnion' && def?.options?.length)
    return def?.options?.some((z: any) => zSame(key, val, z, true))

  else if (zType == 'ZodArray')
    return Array.isArray(val)

  else if (zType == 'ZodDate')
    return val instanceof Date

  return typeof val == zodTypeMap[zType]
}

export function isJoinCompare(val: any, schema?: DBSchema) {
  // if (!schema) return typeof val == 'string' && val?.includes('.')
  if (!schema || typeof val != 'string' || !val?.includes('.'))
    return false

  const keys = zGet(val, schema)
  return keys && keys?.length
}

const reservedWords = new Set([
  'ABORT', 'ACTION', 'ADD', 'AFTER', 'ALL', 'ALTER', 'ANALYZE', 'AND', 'AS',
  'ASC', 'ATTACH', 'AUTOINCREMENT', 'BEFORE', 'BEGIN', 'BETWEEN', 'BY',
  'CASCADE', 'CASE', 'CAST', 'CHECK', 'COLLATE', 'COLUMN', 'COMMIT',
  'CONFLICT', 'CONSTRAINT', 'CREATE', 'CROSS', 'CURRENT', 'CURRENT_DATE',
  'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'DATABASE', 'DEFAULT', 'DEFERRABLE',
  'DEFERRED', 'DELETE', 'DESC', 'DETACH', 'DISTINCT', 'DROP', 'EACH',
  'ELSE', 'END', 'ESCAPE', 'EXCEPT', 'EXCLUSIVE', 'EXISTS', 'EXPLAIN',
  'FAIL', 'FOR', 'FOREIGN', 'FROM', 'FULL', 'GLOB', 'GROUP', 'HAVING',
  'IF', 'IGNORE', 'IMMEDIATE', 'IN', 'INDEX', 'INDEXED', 'INITIALLY',
  'INNER', 'INSERT', 'INSTEAD', 'INTERSECT', 'INTO', 'IS', 'ISNULL',
  'JOIN', 'KEY', 'LEFT', 'LIKE', 'LIMIT', 'MATCH', 'NATURAL', 'NO',
  'NOT', 'NOTNULL', 'NULL', 'OF', 'OFFSET', 'ON', 'OR', 'ORDER',
  'OUTER', 'PLAN', 'PRAGMA', 'PRIMARY', 'QUERY', 'RAISE', 'RECURSIVE',
  'REFERENCES', 'REGEXP', 'REINDEX', 'RELEASE', 'RENAME', 'REPLACE',
  'RESTRICT', 'RIGHT', 'ROLLBACK', 'ROW', 'SAVEPOINT', 'SELECT',
  'SET', 'TABLE', 'TEMP', 'TEMPORARY', 'THEN', 'TO', 'TRANSACTION',
  'TRIGGER', 'UNION', 'UNIQUE', 'UPDATE', 'USING', 'VACUUM', 'VALUES',
  'VIEW', 'VIRTUAL', 'WHEN', 'WHERE', 'WITH', 'WITHOUT',
])
export function tableName(name: string) {
  name = name.trim()
  if (!name || name?.includes('.'))
    throw new Error(`Invalid table name "${!name ? 'empty' : name}"`)

  if (
    /^[0-9]/.test(name)
    || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)
    || reservedWords.has(name.toUpperCase())
  ) {
    return `"${name}"`
  }

  return name
}

export function tableSlug(name: string) {
  return name.trim()
    .replace(/([A-Z])/g, '_$1')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .toLowerCase()
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

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

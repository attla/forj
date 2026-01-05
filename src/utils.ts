
export function parseSelectColumn(
  col: string,
  baseTable: string,
  hasJoin: boolean
): string {
  if (col.toLowerCase().includes(' as '))
    return col

  if (col.includes('.')) {
    const [table, column] = col.split('.')
    return `${table}.${column} AS ${table}_${column}`
  }

  return hasJoin ? `${baseTable}.${col}` : col
}

export function formatValue(value: unknown): string {
  if (value == null || value == undefined)
    return 'NULL'

  if (typeof value == 'number' || typeof value == 'bigint')
    return String(value)

  if (typeof value == 'boolean')
    return value ? '1' : '0'

  if (value instanceof Date)
    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`

  return `'${String(value).replace(/'/g, "''")}'`
}

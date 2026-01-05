import ClauseBuilder from './clause-builder'
import { parseSelectColumn, formatValue } from './utils'
import {
  ClauseOperator,
  IClauseBuilder,
  Operator,
  Primitive,
  Primitives,
  WhereFn,
  OrderDirection,
  JoinType,
  WhereArgs,
} from './types'

// export default class QueryBuilder implements IClauseBuilder {
export default class QueryBuilder {
  #table!: string
  #selects: Set<string> = new Set<string>()
  #clauses!: ClauseBuilder
  #groups: string[] = []
  #orders: string[] = []

  #distinct = false
  #hasJoin = false
  #limit?: number
  #offset?: number

  private joins: string[] = []

  constructor(table: string) {
    this.#table = table
    this.#clauses = new ClauseBuilder(table)
  }

  select(...columns: string[]) {
    columns.flat().forEach(column => {
      column = parseSelectColumn(column, this.#table, this.#hasJoin)
      if (!this.#selects.has(column))
        this.#selects.add(column)
    })

    return this
  }

  distinct() {
    this.#distinct = true
    return this
  }

  /* ============================= */
  /* Join                          */
  /* ============================= */

  #join(
    type: JoinType | undefined,
    table: string,
    columnOrFn: string | WhereFn,
    operator?: Operator | string,
    value?: string
  ) {
    this.#hasJoin = true
    const query = (type ? type +' ' : '')+`JOIN ${table} ON `

    if (typeof columnOrFn == 'function') {
      const join = new ClauseBuilder(table)
      columnOrFn(join)

      this.joins.push(query + join.clauses.join(' '))
      this.#clauses.bindings = join.bindings
      return this
    }

    if (value == undefined && operator != undefined) {
      value = operator
      operator = '='
    }

    this.joins.push(query +`${columnOrFn} ${operator} ${value}`)
    return this
  }

  join(table: string, fn: WhereFn): this
  join(table: string, column: string, value: string): this
  join(table: string, column: string, operator: Operator, value: string): this
  join(table: string, column: string | WhereFn, operator?: Operator | string, value?: string) {
    return this.#join(undefined, table, column, operator, value)
  }

  innerJoin(table: string, fn: WhereFn): this
  innerJoin(table: string, column: string, value: string): this
  innerJoin(table: string, column: string, operator: Operator, value: string): this
  innerJoin(table: string, column: string | WhereFn, operator?: Operator | string, value?: string) {
    return this.#join('INNER', table, column, operator, value)
  }

  leftJoin(table: string, fn: WhereFn): this
  leftJoin(table: string, column: string, value: string): this
  leftJoin(table: string, column: string, operator: Operator, value: string): this
  leftJoin(table: string, column: string | WhereFn, operator?: Operator | string, value?: string) {
    return this.#join('LEFT', table, column, operator, value)
  }

  rightJoin(table: string, fn: WhereFn): this
  rightJoin(table: string, column: string, value: string): this
  rightJoin(table: string, column: string, operator: Operator, value: string): this
  rightJoin(table: string, column: string | WhereFn, operator?: Operator | string, value?: string) {
    return this.#join('RIGHT', table, column, operator, value)
  }

  crossJoin(table: string, fn: WhereFn): this
  crossJoin(table: string, column: string, value: string): this
  crossJoin(table: string, column: string, operator: Operator, value: string): this
  crossJoin(table: string, column: string | WhereFn, operator?: Operator | string, value?: string) {
    return this.#join('CROSS', table, column, operator, value)
  }

  /* ============================= */
  /* Where (core)                  */
  /* ============================= */

  where(...args: WhereArgs) {
    this.#clauses.where(...args)
    return this
  }
  on(...args: WhereArgs) {
    return this.where(...args)
  }

  orWhere(...args: WhereArgs) {
    this.#clauses.orWhere(...args)
    return this
  }
  orOn(...args: WhereArgs) {
    return this.orWhere(...args)
  }

  whereIn(column: string, values: Primitives) {
    this.#clauses.whereIn(column, values)
    return this
  }
  in(column: string, values: Primitives) {
    return this.whereIn(column, values)
  }

  whereNotIn(column: string, values: Primitives) {
    this.#clauses.whereNotIn(column, values)
    return this
  }
  notIn(column: string, values: Primitives) {
    return this.whereNotIn(column, values)
  }

  orWhereIn(column: string, values: Primitives) {
    this.#clauses.orWhereIn(column, values)
    return this
  }
  orIn(column: string, values: Primitives) {
    return this.orWhereIn(column, values)
  }

  orWhereNotIn(column: string, values: Primitives) {
    this.#clauses.orWhereNotIn(column, values)
    return this
  }
  orNotIn(column: string, values: Primitives) {
    return this.orWhereNotIn(column, values)
  }

  whereNull(column: string) {
    this.#clauses.whereNull(column)
    return this
  }
  onNull(column: string) {
    return this.whereNull(column)
  }

  orWhereNull(column: string) {
    this.#clauses.orWhereNull(column)
    return this
  }
  orOnNull(column: string) {
    return this.orWhereNull(column)
  }

  whereNotNull(column: string) {
    this.#clauses.whereNotNull(column)
    return this
  }
  onNotNull(column: string) {
    return this.whereNotNull(column)
  }

  orWhereNotNull(column: string) {
    this.#clauses.orWhereNotNull(column)
    return this
  }
  orNotNull(column: string) {
    return this.orWhereNotNull(column)
  }

  /* ============================= */
  /* Group                         */
  /* ============================= */

  groupBy(...columns: string[]) {
    this.#groups.push(...columns)
    return this
  }

  /* ============================= */
  /* Order                         */
  /* ============================= */

  order(column: string, direction: OrderDirection = 'ASC') {
    this.#orders.push(`${column} ${direction.toUpperCase()}`)
    return this
  }
  orderBy(column: string, direction: OrderDirection = 'ASC') {
    return this.order(column, direction)
  }
  asc(column: string) {
    return this.order(column, 'ASC')
  }
  desc(column: string) {
    return this.order(column, 'DESC')
  }

  /* ============================= */
  /* Limit / Offset                */
  /* ============================= */

  limit(value: number) {
    this.#limit = value
    return this
  }

  offset(value: number) {
    this.#offset = value
    return this
  }

  /* ============================= */
  /* Compile                       */
  /* ============================= */

  toSQL(): string {
    let sql = ''

    sql += `SELECT ${this.#distinct ? 'DISTINCT ' : ''}${
      this.#selects.size ? [...this.#selects].join(', ') : '*'
    }`

    sql += ` FROM ${this.#table}`

    if (this.joins.length)
      sql += ' ' + this.joins.join(' ')

    if (this.#clauses.length)
      sql += ` WHERE ${this.#clauses.clauses.join(' ')}`

    if (this.#groups.length)
      sql += ` GROUP BY ${this.#groups.join(', ')}`

    if (this.#orders.length)
      sql += ` ORDER BY ${this.#orders.join(', ')}`

    if (this.#limit != undefined)
      sql += ` LIMIT ${this.#limit}`
    if (this.#offset != undefined)
      sql += ` OFFSET ${this.#offset}`

    return sql
  }

  #bind(sql: string, values: Primitives) {
    let i = 0
    let out = ''
    let last = 0

    for (let pos = sql.indexOf('?'); pos !== -1; pos = sql.indexOf('?', pos + 1)) {
      if (i >= values.length)
        throw new Error(`Missing bind value at position ${i}`)

      out += sql.slice(last, pos)
      out += formatValue(values[i++])
      last = pos + 1
    }

    if (i < values.length)
      throw new Error(`Too many bind values: expected ${i}, got ${values.length}`)

    return out + sql.slice(last)
  }

  rawSql() {
    return this.#bind(this.toSQL(), this.#clauses.bindings)
  }
}

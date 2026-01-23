import ClauseBuilder from './clause-builder'
import {
  isOperator,
  parseColumn, parseSelectColumn,
  formatValue,
  isJoinCompare,
  zSame, zType,
} from './utils'
import type {
  IJoinBuilder, IClauseBuilder,
  OrderDirection,
  JoinType,
  WhereArgs,
  Values,
  Item,
  JoinArgs,
  DBSchema,
  Pipe,
} from './types'

export default class QueryBuilder<
  S,
  T,
  C extends keyof T = keyof T //,
  // J extends keyof S = keyof S
  // T, // = any,,
  // C extends keyof T = keyof T
// > {
> implements IJoinBuilder<S>, IClauseBuilder<T> {
  #table!: string
  #schema?: DBSchema
  #selects: string[] = []
  #clauses!: ClauseBuilder<T>
  #groups: string[] = []
  #orders: string[] = []

  #distinct = false
  #hasJoin = false
  #limit?: number
  #offset?: number

  #joins: string[] = []

  #pipe?: Pipe<S, T, C>

  constructor(
    table: string,
    schema?: DBSchema,
    pipe?: Pipe<S, T, C>
  ) {
    this.#table = table
    this.#schema = schema
    this.#pipe = pipe
    this.#clauses = new ClauseBuilder<T>(table, schema)
  }

  async run() {
    if (!this.#pipe?.run)
      throw new Error(`No database connection.`)

    return await this.#pipe?.run(this)
  }

  async first<K extends keyof T>(...columns: K[] | K[][]): Promise<null | Item<T, C>> {
    columns?.length && this.select(...columns)
    const resp = await this.run()
    return resp.results?.length ? resp.results[0] : null
  }

  async all<K extends keyof T>(...columns: K[] | K[][]): Promise<Item<T, C>[]> {
    columns?.length && this.select(...columns)
    const resp = await this.run()
    return resp.results
  }

  select<K extends keyof T>(...columns: K[] | K[][]): QueryBuilder<S, T, K> {
    this.#selects.push(...columns.flat(Infinity) as string[])
    return this as any
  }

  distinct() {
    this.#distinct = true
    return this
  }

  #join<J extends keyof S>(
    type: JoinType | undefined,
    table: J,
    ...args: JoinArgs<S, J>
  ) {
    this.#hasJoin = true
    const query = (type ? type + ' ' : '') + `JOIN ${table as string} ON `

    if (typeof args[0] == 'function') {
      const join = new ClauseBuilder<S[J]>(table as string, this.#schema)
      args[0](join)

      this.#joins.push(query + join.clauses.join(' '))
      this.#clauses.args = join.args
      return this
    }

    const length = args.length
    let [column, operator, value, value2] = args

    if (length == 2) { // @ts-ignore
      value = operator
      operator = '='
    } else if (length == 3 && !isOperator(operator)) { // @ts-ignore
      // console.log(column, operator, value, value2) // @ts-ignore
      value = parseColumn(value as string, operator as string) // TODO: check if value is a valid column

      if (this.#schema && !isJoinCompare(value, this.#schema))
        throw new Error(`Table column '${value}' doesn't exists.`)

      operator = '='
    } else if (length == 4) { // @ts-ignore
      // console.log(column, operator, value, value2) // @ts-ignore
      value = parseColumn(value2 as string, value as string)
      operator = '='
    }

    const col = parseColumn(String(column), String(table))
    if (this.#schema && !zSame(col, value, this.#schema))
      throw new Error(`Table column '${col}' of type '${zType(col, this.#schema)}' is not assignable as type of '${typeof value}'.`)

    if (!isJoinCompare(value, this.#schema)) { // @ts-ignore
      this.#clauses.args = [value] // @ts-ignore // TODO: https://developers.cloudflare.com/d1/worker-api/#type-conversion
      value = '?'
    }

    // @ts-ignore
    this.#joins.push(query + col + ` ${operator} ${value}`)
    return this
  }

  join<J extends keyof S>(table: J, ...args: JoinArgs<S, J>) {
    return this.#join(undefined, table, ...args)
  }

  innerJoin<J extends keyof S>(table: J, ...args: JoinArgs<S, J>) {
    return this.#join('INNER', table, ...args)
  }

  leftJoin<J extends keyof S>(table: J, ...args: JoinArgs<S, J>) {
    return this.#join('LEFT', table, ...args)
  }

  rightJoin<J extends keyof S>(table: J, ...args: JoinArgs<S, J>) {
    return this.#join('RIGHT', table, ...args)
  }

  crossJoin<J extends keyof S>(table: J, ...args: JoinArgs<S, J>) {
    return this.#join('CROSS', table, ...args)
  }

  where(...args: WhereArgs<T>) {
    this.#clauses.where(...args)
    return this
  }
  on(...args: WhereArgs<T>) {
    return this.where(...args)
  }

  orWhere(...args: WhereArgs<T>) {
    this.#clauses.orWhere(...args)
    return this
  }
  orOn(...args: WhereArgs<T>) {
    return this.orWhere(...args)
  }

  whereIn(column: C, values: T[C][]) {
    this.#clauses.whereIn(column, values)
    return this
  }
  in(column: C, values: T[C][]) {
    return this.whereIn(column, values)
  }

  whereNotIn(column: C, values: T[C][]) {
    this.#clauses.whereNotIn(column, values)
    return this
  }
  notIn(column: C, values: T[C][]) {
    return this.whereNotIn(column, values)
  }

  orWhereIn(column: C, values: T[C][]) {
    this.#clauses.orWhereIn(column, values)
    return this
  }
  orIn(column: C, values: T[C][]) {
    return this.orWhereIn(column, values)
  }

  orWhereNotIn(column: C, values: T[C][]) {
    this.#clauses.orWhereNotIn(column, values)
    return this
  }
  orNotIn(column: C, values: T[C][]) {
    return this.orWhereNotIn(column, values)
  }

  whereBetween(column: C, one: T[C], two: T[C]) {
    this.#clauses.whereBetween(column, one, two)
    return this
  }
  between(column: C, one: T[C], two: T[C]) {
    return this.whereBetween(column, one, two)
  }

  orWhereBetween(column: C, one: T[C], two: T[C]) {
    this.#clauses.orWhereBetween(column, one, two)
    return this
  }
  orBetween(column: C, one: T[C], two: T[C]) {
    return this.orWhereBetween(column, one, two)
  }

  whereNotBetween(column: C, one: T[C], two: T[C]) {
    this.#clauses.whereNotBetween(column, one, two)
    return this
  }
  notBetween(column: C, one: T[C], two: T[C]) {
    return this.whereNotBetween(column, one, two)
  }

  orWhereNotBetween(column: C, one: T[C], two: T[C]) {
    this.#clauses.orWhereNotBetween(column, one, two)
    return this
  }
  orNotBetween(column: C, one: T[C], two: T[C]) {
    return this.orWhereNotBetween(column, one, two)
  }

  whereNull(column: C) {
    this.#clauses.whereNull(column)
    return this
  }
  onNull(column: C) {
    return this.whereNull(column)
  }

  orWhereNull(column: C) {
    this.#clauses.orWhereNull(column)
    return this
  }
  orOnNull(column: C) {
    return this.orWhereNull(column)
  }

  whereNotNull(column: C) {
    this.#clauses.whereNotNull(column)
    return this
  }
  onNotNull(column: C) {
    return this.whereNotNull(column)
  }

  orWhereNotNull(column: C) {
    this.#clauses.orWhereNotNull(column)
    return this
  }
  orNotNull(column: C) {
    return this.orWhereNotNull(column)
  }

  groupBy(...columns: string[]) {
    this.#groups.push(...columns)
    return this
  }

  order(column: C, direction: OrderDirection = 'ASC') {
    this.#orders.push(parseColumn(column as string, this.#table, this.#hasJoin) +' '+ direction.toUpperCase())
    return this
  }
  orderBy(column: C, direction: OrderDirection = 'ASC') {
    return this.order(column, direction)
  }
  asc(column: C) {
    return this.order(column, 'ASC')
  }
  desc(column: C) {
    return this.order(column, 'DESC')
  }

  limit(val: number | string) {
    val = parseInt(String(val)) || 0
    if (val) this.#limit = val
    return this
  }

  offset(val: number | string) {
    this.#offset = parseInt(String(val)) || 0
    return this
  }

  #bind(sql: string, values: Values) {
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

  get args() {
    return this.#clauses.args
  }
  get arguments() {
    return this.args
  }
  get bindings() {
    return this.args
  }

  get query() {
    let sql = ''

    const selects = new Set<string>()
    this.#selects.forEach(column => {
      column = parseSelectColumn(column, this.#table, this.#hasJoin)
      !selects.has(column) && selects.add(column)
    })

    sql += `SELECT ${this.#distinct ? 'DISTINCT ' : ''}${
      selects.size ? [...selects].join(', ') : '*'
    }`

    sql += ' FROM '+ this.#table

    if (this.#joins.length)
      sql += ' '+ this.#joins.join(' ')

    if (this.#clauses.length)
      sql += ' WHERE '+ this.#clauses.clauses.join(' ')

    if (this.#groups.length)
      sql += ' GROUP BY '+ this.#groups.join(', ')

    if (this.#orders.length)
      sql += ' ORDER BY '+ this.#orders.join(', ')

    if (this.#limit != undefined)
      sql += ' LIMIT '+ this.#limit

    if (this.#offset != undefined)
      sql += ' OFFSET '+ this.#offset

    return sql
  }

  get sql() {
    return this.#bind(this.query, this.#clauses.args)
  }
  get raw() {
    return this.sql
  }
}

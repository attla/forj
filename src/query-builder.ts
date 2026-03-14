import { Timestamp } from 't0n'
import ClauseBuilder from './clause-builder'
import {
  types,
  isOperator,
  parseColumn, parseSelectColumn,
  formatValue,
  isJoinCompare,
  zSame, zType,
  sqlName,
} from './utils'
import type {
  OrderDirection,
  JoinType,
  WhereArgs,
  Value, Values,
  Item,
  JoinArgs,
  DBSchema,
  Pipe,
  QueryType,
  TableOpts,
  WhereFn,
  Operator,
} from './types'

export default class QueryBuilder<
  S,
  T,
  C extends keyof T = keyof T //,
  // J extends keyof S = keyof S
  // T, // = any,,
  // C extends keyof T = keyof T
// > {
> {
  #table!: string
  #schema?: DBSchema
  #type: number = 1
  // #data: Partial<Record<C, Value>> = {}
  #keys: string[] = []
  #values: Value[] = []
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
  #opts: TableOpts = {}

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

  opts(opts: TableOpts) {
    this.#opts = opts
    return this
  }

  async run() {
    if (!this.#pipe?.run)
      throw new Error(`No database connection.`)

    return await this.#pipe?.run(this)
  }

  #setType<K extends keyof T>(type: QueryType, data?: Partial<Record<K, Value>>) {
    this.#type = type
    if (data) {
      this.#keys = Object.keys(data)
      this.#values = Object.values(data)
    }

    return this
  }

  insert<K extends keyof T>(data: Partial<Record<K, Value>>) {
    if (this.#opts.timestamps || this.#opts.createdAt) // @ts-ignore
      data.created_at = Timestamp.now()

    return this.#setType(types.INSERT, data)
  }

  update<K extends keyof T>(data: Partial<Record<K, Value>>) {
    if (this.#opts.timestamps || this.#opts.updatedAt) // @ts-ignore
      data.updated_at = Timestamp.now()

    return this.#setType(types.UPDATE, data)
  }

  delete() {
    return this.#setType(types.DELETE)
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
    this.#type = types.SELECT
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
    const query = (type ? type + ' ' : '') + `JOIN ${sqlName(table as string)} ON `

    if (typeof args[0] === 'function') {
      const join = new ClauseBuilder<S[J]>(table as string, this.#schema)
      args[0](join)

      this.#joins.push(query + join.clauses.join(' '))
      this.#clauses.args = join.args
      return this
    }

    const length = args.length
    let [column, operator, value, value2] = args

    if (length === 2) { // @ts-ignore
      value = operator
      operator = '='
    } else if (length === 3 && !isOperator(operator)) { // @ts-ignore
      value = parseColumn(value as string, operator as string) // TODO: check if value is a valid column

      if (this.#schema && !isJoinCompare(value, this.#schema))
        throw new Error(`Table column '${value}' doesn't exists.`)

      operator = '='
    } else if (length === 4) { // @ts-ignore
      value = parseColumn(value2 as string, value as string)
      operator = '='
    }

    const col = parseColumn(String(column), String(table))

    if (!isJoinCompare(value, this.#schema)) {
      if (this.#schema && !zSame(col.replace(/"/g, ''), value, this.#schema))
        throw new Error(`Table column '${col.replace(/"/g, '')}' of type '${zType(col.replace(/"/g, ''), this.#schema)}' is not assignable as type of '${typeof value}'.`)
      // @ts-ignore
      this.#clauses.args = [value] // @ts-ignore // TODO: https://developers.cloudflare.com/d1/worker-api/#type-conversion
      value = '?'
    }

    // @ts-ignore
    this.#joins.push(query + col + ` ${operator} ${value}`)
    return this
  }

  join<J extends keyof S>(table: J, fn: WhereFn<S[J]>): this
  join<
    J extends keyof S,
    T extends S[J],
    K extends keyof T
  >(table: J, column: K, value: T[K]): this
  join<
    J extends keyof S,
    T extends S[J],
    K extends keyof T
  >(table: J, column: K, operator: Operator, value: T[K]): this
  join<
    J extends keyof S,
    T extends S[J],
    K extends keyof T,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, table2: J2, column2: K2): this
  join<
    J extends keyof S,
    T extends S[J],
    K extends keyof T,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, operator: Operator, table2: J2, column2: K2): this
  join<J extends keyof S>(table: J, ...args: JoinArgs<S, J>) {
    return this.#join(undefined, table, ...args)
  }

  innerJoin<J extends keyof S>(table: J, fn: WhereFn<S[J]>): this
  innerJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T
  >(table: J, column: K, value: T[K]): this
  innerJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T
  >(table: J, column: K, operator: Operator, value: T[K]): this
  innerJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, table2: J2, column2: K2): this
  innerJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, operator: Operator, table2: J2, column2: K2): this
  innerJoin<J extends keyof S>(table: J, ...args: JoinArgs<S, J>) {
    return this.#join('INNER', table, ...args)
  }

  leftJoin<J extends keyof S>(table: J, fn: WhereFn<S[J]>): this
  leftJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T
  >(table: J, column: K, value: T[K]): this
  leftJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T
  >(table: J, column: K, operator: Operator, value: T[K]): this
  leftJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, table2: J2, column2: K2): this
  leftJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, operator: Operator, table2: J2, column2: K2): this
  leftJoin<J extends keyof S>(table: J, ...args: JoinArgs<S, J>) {
    return this.#join('LEFT', table, ...args)
  }

  rightJoin<J extends keyof S>(table: J, fn: WhereFn<S[J]>): this
  rightJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T
  >(table: J, column: K, value: T[K]): this
  rightJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T
  >(table: J, column: K, operator: Operator, value: T[K]): this
  rightJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, table2: J2, column2: K2): this
  rightJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, operator: Operator, table2: J2, column2: K2): this
  rightJoin<J extends keyof S>(table: J, ...args: JoinArgs<S, J>) {
    return this.#join('RIGHT', table, ...args)
  }

  crossJoin<J extends keyof S>(table: J, fn: WhereFn<S[J]>): this
  crossJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T
  >(table: J, column: K, value: T[K]): this
  crossJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T
  >(table: J, column: K, operator: Operator, value: T[K]): this
  crossJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, table2: J2, column2: K2): this
  crossJoin<
    J extends keyof S,
    T extends S[J],
    K extends keyof T,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, operator: Operator, table2: J2, column2: K2): this
  crossJoin<J extends keyof S>(table: J, ...args: JoinArgs<S, J>) {
    return this.#join('CROSS', table, ...args)
  }

  where(fn: WhereFn<T>): this
  where<K extends keyof T>(column: K, value: T[K]): this
  where<K extends keyof T>(column: K, operator: Operator, value: T[K]): this
  where(...args: WhereArgs<T>) {
    this.#clauses.where(...args)
    return this
  }
  on(fn: WhereFn<T>): this
  on<K extends keyof T>(column: K, value: T[K]): this
  on<K extends keyof T>(column: K, operator: Operator, value: T[K]): this
  on(...args: WhereArgs<T>) { // @ts-ignore
    return this.where(...args)
  }

  orWhere(fn: WhereFn<T>): this
  orWhere<K extends keyof T>(column: K, value: T[K]): this
  orWhere<K extends keyof T>(column: K, operator: Operator, value: T[K]): this
  orWhere(...args: WhereArgs<T>) {
    this.#clauses.orWhere(...args)
    return this
  }
  orOn(fn: WhereFn<T>): this
  orOn<K extends keyof T>(column: K, value: T[K]): this
  orOn<K extends keyof T>(column: K, operator: Operator, value: T[K]): this
  orOn(...args: WhereArgs<T>) { // @ts-ignore
    return this.orWhere(...args)
  }

  whereIn<K extends keyof T>(column: K, values: T[K][]) {
    this.#clauses.whereIn(column, values)
    return this
  }
  in<K extends keyof T>(column: K, values: T[K][]) {
    return this.whereIn(column, values)
  }

  whereNotIn<K extends keyof T>(column: K, values: T[K][]) {
    this.#clauses.whereNotIn(column, values)
    return this
  }
  notIn<K extends keyof T>(column: K, values: T[K][]) {
    return this.whereNotIn(column, values)
  }

  orWhereIn<K extends keyof T>(column: K, values: T[K][]) {
    this.#clauses.orWhereIn(column, values)
    return this
  }
  orIn<K extends keyof T>(column: K, values: T[K][]) {
    return this.orWhereIn(column, values)
  }

  orWhereNotIn<K extends keyof T>(column: K, values: T[K][]) {
    this.#clauses.orWhereNotIn(column, values)
    return this
  }
  orNotIn<K extends keyof T>(column: K, values: T[K][]) {
    return this.orWhereNotIn(column, values)
  }

  whereBetween<K extends keyof T>(column: K, one: T[K], two: T[K]) {
    this.#clauses.whereBetween(column, one, two)
    return this
  }
  between<K extends keyof T>(column: K, one: T[K], two: T[K]) {
    return this.whereBetween(column, one, two)
  }

  orWhereBetween<K extends keyof T>(column: K, one: T[K], two: T[K]) {
    this.#clauses.orWhereBetween(column, one, two)
    return this
  }
  orBetween<K extends keyof T>(column: K, one: T[K], two: T[K]) {
    return this.orWhereBetween(column, one, two)
  }

  whereNotBetween<K extends keyof T>(column: K, one: T[K], two: T[K]) {
    this.#clauses.whereNotBetween(column, one, two)
    return this
  }
  notBetween<K extends keyof T>(column: K, one: T[K], two: T[K]) {
    return this.whereNotBetween(column, one, two)
  }

  orWhereNotBetween<K extends keyof T>(column: K, one: T[K], two: T[K]) {
    this.#clauses.orWhereNotBetween(column, one, two)
    return this
  }
  orNotBetween<K extends keyof T>(column: K, one: T[K], two: T[K]) {
    return this.orWhereNotBetween(column, one, two)
  }

  whereNull<K extends keyof T>(column: K) {
    this.#clauses.whereNull(column)
    return this
  }
  onNull<K extends keyof T>(column: K) {
    return this.whereNull(column)
  }

  orWhereNull<K extends keyof T>(column: K) {
    this.#clauses.orWhereNull(column)
    return this
  }
  orOnNull<K extends keyof T>(column: K) {
    return this.orWhereNull(column)
  }

  whereNotNull<K extends keyof T>(column: K) {
    this.#clauses.whereNotNull(column)
    return this
  }
  onNotNull<K extends keyof T>(column: K) {
    return this.whereNotNull(column)
  }

  orWhereNotNull<K extends keyof T>(column: K) {
    this.#clauses.orWhereNotNull(column)
    return this
  }
  orNotNull<K extends keyof T>(column: K) {
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
    if (this.#values.length)
      return [...this.#values, ...this.#clauses.args]

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

    switch (this.#type) {
      case types.SELECT:
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

        break
      case types.INSERT:
        sql += `INSERT INTO ${this.#table} (${this.#keys.map(key => sqlName(key)).join(', ')})`
        sql += ` VALUES (${Array.from({ length: this.#keys.length }, () => '?').join(', ')})`

        break
      case types.UPDATE:
        sql += `UPDATE ${this.#table} SET ${this.#keys.map(key => key + ` = ?`).join(', ')}`

        break
      case types.DELETE:
        sql += `DELETE FROM ` + this.#table

        break
    }

    if (this.#clauses.length)
      sql += ' WHERE '+ this.#clauses.clauses.join(' ')

    if (this.#type === types.SELECT && this.#groups.length)
      sql += ' GROUP BY '+ this.#groups.join(', ')

    if (this.#orders.length)
      sql += ' ORDER BY '+ this.#orders.join(', ')

    if (this.#limit !== undefined)
      sql += ' LIMIT '+ this.#limit

    if (this.#offset !== undefined)
      sql += ' OFFSET '+ this.#offset

    return sql
  }

  get sql() {
    return this.#bind(this.query, this.args)
  }
  get raw() {
    return this.sql
  }
}

import { parseColumn, isJoinCompare, zSame, zType } from './utils'
import type {
  IClauseBuilder,
  ClauseOperator,
  Value, Values,
  WhereFn, WhereArgs,
  DBSchema,
} from './types'

export default class ClauseBuilder<
  T,
  C extends keyof T = keyof T
> implements IClauseBuilder<T> {
  #table: string
  #schema?: DBSchema
  #clauses: string[] = []
  #args: Values = []

  get clauses() {
    return this.#clauses
  }
  set clauses(clauses: string[]) {
    this.#clauses.push(...clauses)
  }

  get args() {
    return this.#args
  }
  set args(args: Values) {
    this.#args.push(...args)
  }

  get length() {
    return this.#clauses.length
  }

  constructor(table: string, schema?: DBSchema) {
    this.#table = table
    this.#schema = schema
  }

  #nested(fn: WhereFn<T>, operator: ClauseOperator = 'AND') {
    const nested = new ClauseBuilder<T, C>(this.#table, this.#schema)
    fn(nested)

    if (nested.length) {
      this.#clauses.push(`${this.length ? operator +' ' : ''}(${nested.clauses.join(' ')})`)
      this.#args.push(...nested.args)
    }

    return this
  }

  #clause(sql: string, values: Values = [], bool: ClauseOperator = 'AND') {
    if (this.length) sql = bool +' '+ sql
    this.#clauses.push(sql)

    if (values?.length) // TODO: https://developers.cloudflare.com/d1/worker-api/#type-conversion
      this.#args.push(...values)

    return this
  }

  #where(
    logical: ClauseOperator,
    ...args: WhereArgs<T>
  ) {
    if (typeof args[0] == 'function')
      return this.#nested(args[0], logical)

    const length = args.length
    let [column, operator, value] = args

    if (length == 2) { // @ts-ignore
      value = operator
      operator = '='
    }

    // @ts-ignore
    column = parseColumn(String(column), this.#table)

    if (this.#schema && !zSame(column.replace(/"/g, ''), value, this.#schema))
      throw new Error(`Table column '${String(column.replace(/"/g, ''))}' of type '${zType(column.replace(/"/g, ''), this.#schema)}' is not assignable as type of '${typeof value}'.`)

    return isJoinCompare(value, this.#schema) // @ts-ignore
      ? this.#clause(`${column} ${operator} ${value}`, [], logical) // @ts-ignore
      : this.#clause(`${column} ${operator} ?`, [value], logical)
  }

  where(...args: WhereArgs<T>) {
    return this.#where('AND', ...args)
  }
  on(...args: WhereArgs<T>) {
    return this.where(...args)
  }

  orWhere(...args: WhereArgs<T>) {
    return this.#where('OR', ...args)
  }
  orOn(...args: WhereArgs<T>) {
    return this.orWhere(...args)
  }

  #in(
    column: string,
    values: Values,
    operator: 'IN' | 'NOT IN',
    logical: ClauseOperator = 'AND'
  ) {
    if (!values?.length) return this
    return this.#clause(parseColumn(column, this.#table) + ` ${operator} (${values.map(() => '?').join(', ')})`, values, logical)
  }

  whereIn<K extends keyof T>(column: K, values: T[K][]) { // @ts-ignore
    return this.#in(column, values, 'IN')
  }
  in<K extends keyof T>(column: K, values: T[K][]) {
    return this.whereIn(column, values)
  }

  whereNotIn<K extends keyof T>(column: K, values: T[K][]) { // @ts-ignore
    return this.#in(column, values, 'NOT IN')
  }
  notIn<K extends keyof T>(column: K, values: T[K][]) {
    return this.whereNotIn(column, values)
  }

  orWhereIn<K extends keyof T>(column: K, values: T[K][]) { // @ts-ignore
    return this.#in(column, values, 'IN', 'OR')
  }
  orIn<K extends keyof T>(column: K, values: T[K][]) {
    return this.orWhereIn(column, values)
  }

  orWhereNotIn<K extends keyof T>(column: K, values: T[K][]) { // @ts-ignore
    return this.#in(column, values, 'NOT IN', 'OR')
  }
  orNotIn<K extends keyof T>(column: K, values: T[K][]) {
    return this.orWhereNotIn(column, values)
  }

  #between(
    column: string,
    one: Value,
    two: Value,
    operator: 'BETWEEN' | 'NOT BETWEEN',
    logical: ClauseOperator = 'AND'
  ) {
    return this.#clause(parseColumn(column, this.#table) + ` ${operator} ? AND ?`, [one, two], logical)
  }

  whereBetween<K extends keyof T>(column: K, one: T[K], two: T[K]) { // @ts-ignore
    return this.#between(column, one, two, 'BETWEEN')
  }
  between<K extends keyof T>(column: K, one: T[K], two: T[K]) {
    return this.whereBetween(column, one, two)
  }

  orWhereBetween<K extends keyof T>(column: K, one: T[K], two: T[K]) { // @ts-ignore
    return this.#between(column, one, two, 'BETWEEN', 'OR')
  }
  orBetween<K extends keyof T>(column: K, one: T[K], two: T[K]) {
    return this.orWhereBetween(column, one, two)
  }

  whereNotBetween<K extends keyof T>(column: K, one: T[K], two: T[K]) { // @ts-ignore
    return this.#between(column, one, two, 'NOT BETWEEN')
  }
  notBetween<K extends keyof T>(column: K, one: T[K], two: T[K]) {
    return this.whereNotBetween(column, one, two)
  }

  orWhereNotBetween<K extends keyof T>(column: K, one: T[K], two: T[K]) { // @ts-ignore
    return this.#between(column, one, two, 'NOT BETWEEN', 'OR')
  }
  orNotBetween<K extends keyof T>(column: K, one: T[K], two: T[K]) {
    return this.orWhereNotBetween(column, one, two)
  }

  #null(
    column: string,
    operator: 'IS' | 'IS NOT' = 'IS',
    logical: ClauseOperator = 'AND'
  ) {
    return this.#clause(parseColumn(column, this.#table) +` ${operator} NULL`, [], logical)
  }

  whereNull<K extends keyof T>(column: K) {
    return this.#null(column as string)
  }
  onNull<K extends keyof T>(column: K) {
    return this.whereNull(column)
  }

  orWhereNull<K extends keyof T>(column: K) {
    return this.#null(column as string, 'IS', 'OR')
  }
  orOnNull<K extends keyof T>(column: K) {
    return this.orWhereNull(column)
  }

  whereNotNull<K extends keyof T>(column: K) {
    return this.#null(column as string, 'IS NOT')
  }
  onNotNull<K extends keyof T>(column: K) {
    return this.whereNotNull(column)
  }

  orWhereNotNull<K extends keyof T>(column: K) {
    return this.#null(column as string, 'IS NOT', 'OR')
  }
  orNotNull<K extends keyof T>(column: K) {
    return this.orWhereNotNull(column)
  }
}

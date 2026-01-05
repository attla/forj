import {
  IClauseBuilder,
  ClauseOperator,
  Values,
  WhereFn,
  WhereArgs,
} from './types'

export default class ClauseBuilder implements IClauseBuilder {
  #table: string
  #clauses: string[] = []
  #bindings: Values = []

  get clauses() {
    return this.#clauses
  }
  set clauses(clauses: string[]) {
    this.#clauses.push(...clauses)
  }

  get bindings() {
    return this.#bindings
  }
  set bindings(bindings: Values) {
    this.#bindings.push(...bindings)
  }

  get length() {
    return this.#clauses.length
  }

  constructor(table: string) {
    this.#table = table
  }

  #nested(fn: WhereFn, operator: ClauseOperator = 'AND') {
    const nested = new ClauseBuilder(this.#table)
    fn(nested)

    if (nested.length) {
      this.#clauses.push(`${this.length ? operator +' ' : ''}(${nested.clauses.join(' ')})`)
      this.#bindings.push(...nested.bindings)
    }

    return this
  }

  #clause(sql: string, values: Values = [], bool: ClauseOperator = 'AND') {
    if (this.length) sql = bool +' '+ sql
    this.#clauses.push(sql)

    if (values?.length) // TODO: https://developers.cloudflare.com/d1/worker-api/#type-conversion
      this.#bindings.push(...values)

    return this
  }

  #column(name: string) {
    return name.includes('.') ? name : this.#table +'.'+ name
  }

  #where(
    logical: ClauseOperator,
    ...args: WhereArgs
  ) {
    if (typeof args[0] == 'function')
      return this.#nested(args[0], logical)

    const length = args.length
    let [column, operator, value] = args

    if (length == 2) {
      value = operator
      operator = '='
    }

    column = this.#column(String(column))

    return typeof value == 'string' && value.includes('.') // TODO: check if before "." has a valid know table
      ? this.#clause(`${column} ${operator} ${value}`, [], logical)
      : this.#clause(`${column} ${operator} ?`, [value], logical)
  }

  where(...args: WhereArgs) {
    return this.#where('AND', ...args)
  }
  on(...args: WhereArgs) {
    return this.where(...args)
  }

  orWhere(...args: WhereArgs) {
    return this.#where('OR', ...args)
  }
  orOn(...args: WhereArgs) {
    return this.orWhere(...args)
  }

  #in(
    column: string,
    values: Values,
    operator: 'IN' | 'NOT IN',
    logicalOperator: ClauseOperator = 'AND'
  ) {
    if (!values?.length) return this
    return this.#clause(this.#column(column) + ` ${operator} (${values.map(() => '?').join(', ')})`, values, logicalOperator)
  }
  whereIn(column: string, values: Values) {
    return this.#in(column, values, 'IN')
  }
  in(column: string, values: Values) {
    return this.whereIn(column, values)
  }

  whereNotIn(column: string, values: Values) {
    return this.#in(column, values, 'NOT IN')
  }
  notIn(column: string, values: Values) {
    return this.whereNotIn(column, values)
  }

  orWhereIn(column: string, values: Values) {
    return this.#in(column, values, 'IN', 'OR')
  }
  orIn(column: string, values: Values) {
    return this.orWhereIn(column, values)
  }

  orWhereNotIn(column: string, values: Values) {
    return this.#in(column, values, 'NOT IN', 'OR')
  }
  orNotIn(column: string, values: Values) {
    return this.orWhereNotIn(column, values)
  }

  #null(
    column: string,
    operator: 'IS' | 'IS NOT' = 'IS',
    logical: ClauseOperator = 'AND'
  ) {
    return this.#clause(`${this.#column(column)} ${operator} NULL`, [], logical)
  }

  whereNull(column: string) {
    return this.#null(column)
  }
  onNull(column: string) {
    return this.whereNull(column)
  }

  orWhereNull(column: string) {
    return this.#null(column, 'IS', 'OR')
  }
  orOnNull(column: string) {
    return this.orWhereNull(column)
  }

  whereNotNull(column: string) {
    return this.#null(column, 'IS NOT')
  }
  onNotNull(column: string) {
    return this.whereNotNull(column)
  }

  orWhereNotNull(column: string) {
    return this.#null(column, 'IS NOT', 'OR')
  }
  orNotNull(column: string) {
    return this.orWhereNotNull(column)
  }
}

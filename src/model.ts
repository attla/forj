import pluralize from 'pluralize'
import QueryBuilder from './query-builder'
import type {
  Operator, OrderDirection,
  WhereFn, WhereArgs,
  DBSchema, Pipe,
} from './types'

export default abstract class Model<TB extends keyof DB, DB> {
  // Property only for the compiler (does not exist at runtime)
  readonly $DBShape!: DB
  readonly $TShape!: DB[TB]

  static $table: string = ''
  static $schema?: DBSchema

  static pipe<S, T>(): Pipe<S, T> {
    throw new Error(`Database connection not provided.`) // TODO: improv this message
  }

  static builder<S, T>() {
    const table = this.$table || pluralize(this.name.toLowerCase())

    return new QueryBuilder<S, T>(table, this.$schema, this.pipe<S, T>())
  }

  static select< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, ...columns: C[] | C[][]) {
    return this.builder<I['$DBShape'], T>().select(...columns)
  }

  static distinct< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape']
  >(this: M) {
    return this.builder<I['$DBShape'], T>().distinct()
  }

  static where< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, fn: WhereFn<T>): QueryBuilder<I['$DBShape'], T, C>
  static where< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, value: T[C]): QueryBuilder<I['$DBShape'], T, C>
  static where< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, operator: Operator, value: T[C]): QueryBuilder<I['$DBShape'], T, C>
  static where< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape']
  >(this: M, ...args: WhereArgs<T>) {
    return this.builder<I['$DBShape'], T>().where(...args)
  }

  static on< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, fn: WhereFn<T>): QueryBuilder<I['$DBShape'], T, C>
  static on< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, value: T[C]): QueryBuilder<I['$DBShape'], T, C>
  static on< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, operator: Operator, value: T[C]): QueryBuilder<I['$DBShape'], T, C>
  static on< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape']
  >(this: M, ...args: WhereArgs<T>) {
    return this.builder<I['$DBShape'], T>().where(...args)
  }

  static whereIn< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, value: T[C][]) {
    return this.builder<I['$DBShape'], T>().whereIn(column, value)
  }

  static in< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, value: T[C][]) {
    return this.builder<I['$DBShape'], T>().whereIn(column, value)
  }

  static whereNotIn< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, value: T[C][]) {
    return this.builder<I['$DBShape'], T>().whereNotIn(column, value)
  }

  static notIn< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, value: T[C][]) {
    return this.builder<I['$DBShape'], T>().whereNotIn(column, value)
  }

  static whereBetween< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, one: T[C], two: T[C]) {
    return this.builder<I['$DBShape'], T>().whereBetween(column, one, two)
  }

  static between< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, one: T[C], two: T[C]) {
    return this.builder<I['$DBShape'], T>().whereBetween(column, one, two)
  }

  static whereNotBetween< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, one: T[C], two: T[C]) {
    return this.builder<I['$DBShape'], T>().whereNotBetween(column, one, two)
  }

  static notBetween< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, one: T[C], two: T[C]) {
    return this.builder<I['$DBShape'], T>().whereNotBetween(column, one, two)
  }

  static whereNull< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C) {
    return this.builder<I['$DBShape'], T>().whereNull(column)
  }

  static onNull< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C) {
    return this.builder<I['$DBShape'], T>().whereNull(column)
  }

  static whereNotNull< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C) {
    return this.builder<I['$DBShape'], T>().whereNotNull(column)
  }

  static onNotNull< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C) {
    return this.builder<I['$DBShape'], T>().whereNotNull(column)
  }

  // TODO: groupBy(...columns: string[])

  static order< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, direction: OrderDirection = 'ASC') {
    return this.builder<I['$DBShape'], T>().order(column, direction)
  }

  static orderBy< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, direction: OrderDirection = 'ASC') {
    return this.builder<I['$DBShape'], T>().order(column, direction)
  }

  static asc< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C) {
    return this.builder<I['$DBShape'], T>().asc(column)
  }

  static desc< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C) {
    return this.builder<I['$DBShape'], T>().desc(column)
  }

  static limit< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape']
  >(this: M, val: number | string) {
    return this.builder<I['$DBShape'], T>().limit(val)
  }

  static offset< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape']
  >(this: M, val: number | string) {
    return this.builder<I['$DBShape'], T>().offset(val)
  }

}

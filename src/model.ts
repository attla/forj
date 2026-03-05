import pluralize from 'pluralize'
import QueryBuilder from './query-builder'
import type {
  Operator, OrderDirection,
  WhereFn, WhereArgs,
  DBSchema, Pipe,
  Value,
  JoinArgs,
} from './types'

export default abstract class Model<TB extends keyof DB, DB> {
  // Property only for the compiler (does not exist at runtime)
  readonly $DBShape!: DB
  readonly $TShape!: DB[TB]

  static $table: string = ''
  static $schema?: DBSchema

  static $timestamps?: boolean = false
  static $createdAt?: boolean = false
  static $updatedAt?: boolean = false

  static pipe<S, T>(): Pipe<S, T> {
    throw new Error(`Database connection not provided.`) // TODO: improv this message
  }

  static builder<S, T>() {
    const table = this.$table || pluralize(this.name.toLowerCase())

    return new QueryBuilder<S, T>(table, this.$schema, this.pipe<S, T>()).opts({
      timestamps: this.$timestamps,
      createdAt: this.$createdAt,
      updatedAt: this.$updatedAt,
    })
  }

  static insert< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
  >(this: M, data: Record<keyof T, Value>) {
    return this.builder<I['$DBShape'], T>().insert(data)
  }

  static update< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
  >(this: M, data: Record<keyof T, Value>) {
    return this.builder<I['$DBShape'], T>().update(data)
  }

  static delete< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
  >(this: M) {
    return this.builder<I['$DBShape'], T>().delete()
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

  static join< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
  >(this: M, table: J, fn: WhereFn<T>): QueryBuilder<S, T>
  static join< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1
  >(table: J, column: K, value: T[K]): QueryBuilder<S, T>
  static join< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1
  >(table: J, column: K, operator: Operator, value: T[K]): QueryBuilder<S, T>
  static join< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, table2: J2, column2: K2): QueryBuilder<S, T>
  static join< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, operator: Operator, table2: J2, column2: K2): QueryBuilder<S, T>
  static join< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    J extends keyof S
  >(this: M, table: J, ...args: JoinArgs<S, J>) { // @ts-ignore
    return this.builder<S, I['$TShape']>().join(table, ...args)
  }

  static innerJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
  >(this: M, table: J, fn: WhereFn<T>): QueryBuilder<S, T>
  static innerJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1
  >(table: J, column: K, value: T[K]): QueryBuilder<S, T>
  static innerJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1
  >(table: J, column: K, operator: Operator, value: T[K]): QueryBuilder<S, T>
  static innerJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, table2: J2, column2: K2): QueryBuilder<S, T>
  static innerJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, operator: Operator, table2: J2, column2: K2): QueryBuilder<S, T>
  static innerJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    J extends keyof S
  >(this: M, table: J, ...args: JoinArgs<S, J>) { // @ts-ignore
    return this.builder<S, I['$TShape']>().innerJoin(table, ...args)
  }

  static rightJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
  >(this: M, table: J, fn: WhereFn<T>): QueryBuilder<S, T>
  static rightJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1
  >(table: J, column: K, value: T[K]): QueryBuilder<S, T>
  static rightJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1
  >(table: J, column: K, operator: Operator, value: T[K]): QueryBuilder<S, T>
  static rightJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, table2: J2, column2: K2): QueryBuilder<S, T>
  static rightJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, operator: Operator, table2: J2, column2: K2): QueryBuilder<S, T>
  static rightJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    J extends keyof S
  >(this: M, table: J, ...args: JoinArgs<S, J>) { // @ts-ignore
    return this.builder<S, I['$TShape']>().rightJoin(table, ...args)
  }

  static crossJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
  >(this: M, table: J, fn: WhereFn<T>): QueryBuilder<S, T>
  static crossJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1
  >(table: J, column: K, value: T[K]): QueryBuilder<S, T>
  static crossJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1
  >(table: J, column: K, operator: Operator, value: T[K]): QueryBuilder<S, T>
  static crossJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, table2: J2, column2: K2): QueryBuilder<S, T>
  static crossJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    T extends I['$TShape'],
    J extends keyof S,
    T1 extends S[J],
    K extends keyof T1,
    J2 extends keyof S,
    K2 extends keyof S[J2],
  >(table: J, column: K, operator: Operator, table2: J2, column2: K2): QueryBuilder<S, T>
  static crossJoin< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    S extends I['$DBShape'],
    J extends keyof S
  >(this: M, table: J, ...args: JoinArgs<S, J>) { // @ts-ignore
    return this.builder<S, I['$TShape']>().crossJoin(table, ...args)
  }

  static where< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape']
  >(this: M, fn: WhereFn<T>): QueryBuilder<I['$DBShape'], T>
  static where< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, value: T[C]): QueryBuilder<I['$DBShape'], T>
  static where< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, operator: Operator, value: T[C]): QueryBuilder<I['$DBShape'], T>
  static where< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape']
  >(this: M, ...args: WhereArgs<T>) { // @ts-ignore
    return this.builder<I['$DBShape'], T>().where(...args)
  }

  static on< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape']
  >(this: M, fn: WhereFn<T>): QueryBuilder<I['$DBShape'], T>
  static on< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, value: T[C]): QueryBuilder<I['$DBShape'], T>
  static on< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape'],
    C extends keyof T
  >(this: M, column: C, operator: Operator, value: T[C]): QueryBuilder<I['$DBShape'], T>
  static on< // @ts-ignore
    M extends typeof Model<TB, DB>,
    I extends InstanceType<M>,
    T extends I['$TShape']
  >(this: M, ...args: WhereArgs<T>) { // @ts-ignore
    return this.where(...args)
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

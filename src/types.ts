import z from 'zod'
import QueryBuilder from './query-builder'

export type text = string
export type real = number
export type integer = number
export type bool = boolean | 0 | 1

export type Primitive = null | number | string | boolean
export type Primitives = Primitive[]

export type Value = Primitive | undefined
export type Values = Value[]

// export type WriteType = Primitive | ArrayBuffer | ArrayBufferView | undefined
// export type ReadType = Primitive | any[]

export type Operator = '=' | '!=' | '<' | '>' | '<=' | '>=' | 'LIKE' // | 'IN' | 'NOT IN' | 'BETWEEN' | 'IS NULL' | 'IS NOT NULL'
export type OrderDirection = 'ASC' | 'DESC' | 'asc' | 'desc'

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS'

export type DBSchema = z.ZodObject<any>

export type SchemaObject = Record<string, z.ZodTypeAny>
export type SchemaKeys<TSchema extends DBSchema> =
  TSchema extends z.ZodObject<infer TShape>
    ? keyof TShape
    : TSchema extends SchemaObject
      ? keyof TSchema
      : never

// TODO: transform QueryBuilder<S, T, C> into a interface
export type RunFn<S, T, C extends keyof T = keyof T> = (qb: QueryBuilder<S, T, C>) => Promise<Result<T, C>>
// export type RunBatchFn<S, T, C extends keyof T = keyof T> = (qb: QueryBuilder<S, T, C>[]) => Promise<Result<T, C>>[]

export type Pipe<S, T, C extends keyof T = keyof T> = {
  run: RunFn<S, T, C>,
  // batch: RunBatchFn<S, T, C>,
}

export type Result<T, C extends keyof T> = {
  changes: number,
  duration: number,
  lastId?: number | string,
  rowsRead: number,
  rowsWritten: number,
  success: boolean,
  results: Item<T, C>[],
}

export type Item<B, S extends keyof B, T = Pick<B, S>> = { [K in keyof T]: T[K] } & {}

export type ClauseOperator = 'AND' | 'OR'

export type WhereFn<T, C extends keyof T = keyof T> = (q: IClauseBuilder<T, C>) => void
export type WhereArgs<T, C extends keyof T = keyof T> = [WhereFn<T, C>] | [C, T[C]] | [C, Operator, T[C]]

export interface IClauseBuilder<T, C extends keyof T = keyof T> {
  where(fn: WhereFn<T, C>): this
  where(column: C, value: T[C]): this
  where(column: C, operator: Operator, value: T[C]): this
  where(...args: WhereArgs<T>): this

  on(fn: WhereFn<T, C>): this
  on(column: C, value: T[C]): this
  on(column: C, operator: Operator, value: T[C]): this
  on(...args: WhereArgs<T>): this

  orWhere(fn: WhereFn<T, C>): this
  orWhere(column: C, value: T[C]): this
  orWhere(column: C, operator: Operator, value: T[C]): this
  orWhere(...args: WhereArgs<T>): this

  orOn(fn: WhereFn<T, C>): this
  orOn(column: C, value: T[C]): this
  orOn(column: C, operator: Operator, value: T[C]): this
  orOn(...args: WhereArgs<T>): this

  whereIn(column: C, values: T[C][]): this
  in(column: C, values: T[C][]): this

  whereNotIn(column: C, values: T[C][]): this
  notIn(column: C, values: T[C][]): this

  orWhereIn(column: C, values: T[C][]): this
  orIn(column: C, values: T[C][]): this

  orWhereNotIn(column: C, values: T[C][]): this
  orNotIn(column: C, values: T[C][]): this

  whereBetween(column: C, one: T[C], two: T[C]): this
  between(column: C, one: T[C], two: T[C]): this

  orWhereBetween(column: C, one: T[C], two: T[C]): this
  orBetween(column: C, one: T[C], two: T[C]): this

  whereNotBetween(column: C, one: T[C], two: T[C]): this
  notBetween(column: C, one: T[C], two: T[C]): this

  orWhereNotBetween(column: C, one: T[C], two: T[C]): this
  orNotBetween(column: C, one: T[C], two: T[C]): this

  whereNull(column: C): this
  onNull(column: C): this

  orWhereNull(column: C): this
  orOnNull(column: C): this

  whereNotNull(column: C): this
  onNotNull(column: C): this

  orWhereNotNull(column: C): this
  orNotNull(column: C): this
}

export type JoinArgs<S, J extends keyof S> =
  [WhereFn<S[J]>]
  | [keyof S[J], S[J][keyof S[J]]]
  | [keyof S[J], Operator, S[J][keyof S[J]]]
  | [keyof S[J], keyof S, keyof S[keyof S]]
  | [keyof S[J], Operator, S[J][keyof S[J]]]
  | [keyof S[J], Operator, keyof S, keyof S[keyof S]]

export interface IJoinBuilder<S> {
  join<J extends keyof S>(table: J, fn: WhereFn<S[J]>): this
  join<
    J extends keyof S,
    T extends S[J],
    C extends keyof T
  >(table: J, column: C, value: T[C]): this
  join<
    J extends keyof S,
    T extends S[J],
    C extends keyof T
  >(table: J, column: C, operator: Operator, value: T[C]): this
  join<
    J extends keyof S,
    T extends S[J],
    C extends keyof T,
    J2 extends keyof S,
    C2 extends keyof S[J2],
  >(table: J, column: C, table2: J2, column2: C2): this
  join<
    J extends keyof S,
    T extends S[J],
    C extends keyof T,
    J2 extends keyof S,
    C2 extends keyof S[J2],
  >(table: J, column: C, operator: Operator, table2: J2, column2: C2): this
  join<J extends keyof S>(table: J, ...args: JoinArgs<S, J>): this

  innerJoin<J extends keyof S>(table: J, fn: WhereFn<S[J]>): this
  innerJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T
  >(table: J, column: C, value: T[C]): this
  innerJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T
  >(table: J, column: C, operator: Operator, value: T[C]): this
  innerJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T,
    J2 extends keyof S,
    C2 extends keyof S[J2],
  >(table: J, column: C, table2: J2, column2: C2): this
  innerJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T,
    J2 extends keyof S,
    C2 extends keyof S[J2],
  >(table: J, column: C, operator: Operator, table2: J2, column2: C2): this
  innerJoin<J extends keyof S>(table: J, ...args: JoinArgs<S, J>): this

  leftJoin<J extends keyof S>(table: J, fn: WhereFn<S[J]>): this
  leftJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T
  >(table: J, column: C, value: T[C]): this
  leftJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T
  >(table: J, column: C, operator: Operator, value: T[C]): this
  leftJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T,
    J2 extends keyof S,
    C2 extends keyof S[J2],
  >(table: J, column: C, table2: J2, column2: C2): this
  leftJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T,
    J2 extends keyof S,
    C2 extends keyof S[J2],
  >(table: J, column: C, operator: Operator, table2: J2, column2: C2): this
  leftJoin<J extends keyof S>(table: J, ...args: JoinArgs<S, J>): this

  rightJoin<J extends keyof S>(table: J, fn: WhereFn<S[J]>): this
  rightJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T
  >(table: J, column: C, value: T[C]): this
  rightJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T
  >(table: J, column: C, operator: Operator, value: T[C]): this
  rightJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T,
    J2 extends keyof S,
    C2 extends keyof S[J2],
  >(table: J, column: C, table2: J2, column2: C2): this
  rightJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T,
    J2 extends keyof S,
    C2 extends keyof S[J2],
  >(table: J, column: C, operator: Operator, table2: J2, column2: C2): this
  rightJoin<J extends keyof S>(table: J, ...args: JoinArgs<S, J>): this

  crossJoin<J extends keyof S>(table: J, fn: WhereFn<S[J]>): this
  crossJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T
  >(table: J, column: C, value: T[C]): this
  crossJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T
  >(table: J, column: C, operator: Operator, value: T[C]): this
  crossJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T,
    J2 extends keyof S,
    C2 extends keyof S[J2],
  >(table: J, column: C, table2: J2, column2: C2): this
  crossJoin<
    J extends keyof S,
    T extends S[J],
    C extends keyof T,
    J2 extends keyof S,
    C2 extends keyof S[J2],
  >(table: J, column: C, operator: Operator, table2: J2, column2: C2): this
  crossJoin<J extends keyof S>(table: J, ...args: JoinArgs<S, J>): this
}

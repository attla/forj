import z from 'zod'
import QueryBuilder from './query-builder'
import { types } from './utils'

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

export type QueryType = typeof types[keyof typeof types]
export type TableOpts = {
  timestamps?: boolean,
  createdAt?: boolean,
  updatedAt?: boolean,
}

export type Operator = '=' | '!=' | '<' | '>' | '<=' | '>=' | 'LIKE' // | 'IN' | 'NOT IN' | 'BETWEEN' | 'IS NULL' | 'IS NOT NULL'
export type OrderDirection = 'ASC' | 'DESC' | 'asc' | 'desc'

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS'

export type DBSchema = z.ZodObject<z.ZodRawShape>

export type SchemaObject = z.ZodRawShape

export type SchemaKeys<TSchema extends DBSchema | SchemaObject> =
  TSchema extends z.ZodObject<infer TShape extends z.ZodRawShape>
    ? keyof TShape
    : TSchema extends z.ZodRawShape
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

export type WhereFn<T> = (q: IClauseBuilder<T>) => void
export type WhereArgs<T, C extends keyof T = keyof T> = [WhereFn<T>] | [C, T[C]] | [C, Operator, T[C]]

export interface IClauseBuilder<T> {
  where<K extends keyof T>(column: K, value: T[K]): this
  where<K extends keyof T>(column: K, operator: Operator, value: T[K]): this

  on<K extends keyof T>(column: K, value: T[K]): this
  on<K extends keyof T>(column: K, operator: Operator, value: T[K]): this

  orWhere<K extends keyof T>(column: K, value: T[K]): this
  orWhere<K extends keyof T>(column: K, operator: Operator, value: T[K]): this

  orOn<K extends keyof T>(column: K, value: T[K]): this
  orOn<K extends keyof T>(column: K, operator: Operator, value: T[K]): this

  whereIn<K extends keyof T>(column: K, values: T[K][]): this
  in<K extends keyof T>(column: K, values: T[K][]): this

  whereNotIn<K extends keyof T>(column: K, values: T[K][]): this
  notIn<K extends keyof T>(column: K, values: T[K][]): this

  orWhereIn<K extends keyof T>(column: K, values: T[K][]): this
  orIn<K extends keyof T>(column: K, values: T[K][]): this

  orWhereNotIn<K extends keyof T>(column: K, values: T[K][]): this
  orNotIn<K extends keyof T>(column: K, values: T[K][]): this

  whereBetween<K extends keyof T>(column: K, one: T[K], two: T[K]): this
  between<K extends keyof T>(column: K, one: T[K], two: T[K]): this

  orWhereBetween<K extends keyof T>(column: K, one: T[K], two: T[K]): this
  orBetween<K extends keyof T>(column: K, one: T[K], two: T[K]): this

  whereNotBetween<K extends keyof T>(column: K, one: T[K], two: T[K]): this
  notBetween<K extends keyof T>(column: K, one: T[K], two: T[K]): this

  orWhereNotBetween<K extends keyof T>(column: K, one: T[K], two: T[K]): this
  orNotBetween<K extends keyof T>(column: K, one: T[K], two: T[K]): this

  whereNull<K extends keyof T>(column: K): this
  onNull<K extends keyof T>(column: K): this

  orWhereNull<K extends keyof T>(column: K): this
  orOnNull<K extends keyof T>(column: K): this

  whereNotNull<K extends keyof T>(column: K): this
  onNotNull<K extends keyof T>(column: K): this

  orWhereNotNull<K extends keyof T>(column: K): this
  orNotNull<K extends keyof T>(column: K): this
}

export type JoinArgs<S, J extends keyof S> =
  [WhereFn<S[J]>]
  | [keyof S[J], S[J][keyof S[J]]]
  | [keyof S[J], Operator, S[J][keyof S[J]]]
  | [keyof S[J], keyof S, keyof S[keyof S]]
  | [keyof S[J], Operator, S[J][keyof S[J]]]
  | [keyof S[J], Operator, keyof S, keyof S[keyof S]]

export interface IJoinBuilder<S> {
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
}

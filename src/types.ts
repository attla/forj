export type text = string
export type real = number
export type integer = number
export type bool = boolean | 0 | 1

export type Primitive = null | number | string | boolean
export type Primitives = Primitive[]

export type Value = Primitive | undefined
export type Values = Value[]

export type WriteType = Primitive | ArrayBuffer | ArrayBufferView | undefined
export type ReadType = Primitive | any[]

export type DBSchema = Record<string, TableSchema>
export type TableSchema = {[key: string]: Primitive | TableSchema}

export type TableName<T extends DBSchema> = keyof T
export type ColumnName<T extends TableSchema> = keyof T

export type ClauseOperator = 'AND' | 'OR'
export type WhereFn = (q: IClauseBuilder) => void
export type WhereArgs = [WhereFn] | [string, Value] | [string, Operator, Value]

export interface IClauseBuilder {
  where(fn: WhereFn): this
  where(column: string, value: Value): this
  where(column: string, operator: Operator, value: Value): this
  where(...args: WhereArgs): this

  on(fn: WhereFn): this
  on(column: string, value: Value): this
  on(column: string, operator: Operator, value: Value): this
  on(...args: WhereArgs): this

  orWhere(fn: WhereFn): this
  orWhere(column: string, value: Value): this
  orWhere(column: string, operator: Operator, value: Value): this
  orWhere(...args: WhereArgs): this

  orOn(fn: WhereFn): this
  orOn(column: string, value: Value): this
  orOn(column: string, operator: Operator, value: Value): this
  orOn(...args: WhereArgs): this

  whereIn(column: string, values: Values): this
  in(column: string, values: Values): this

  whereNotIn(column: string, values: Values): this
  notIn(column: string, values: Values): this

  orWhereIn(column: string, values: Values): this
  orIn(column: string, values: Values): this

  orWhereNotIn(column: string, values: Values): this
  orNotIn(column: string, values: Values): this

  whereNull(column: string): this
  onNull(column: string): this

  orWhereNull(column: string): this
  orOnNull(column: string): this

  whereNotNull(column: string): this
  onNotNull(column: string): this

  orWhereNotNull(column: string): this
  orNotNull(column: string): this
}

export type Operator = '=' | '!=' | '<' | '>' | '<=' | '>=' | 'LIKE' // | 'IN' | 'NOT IN' | 'BETWEEN' | 'IS NULL' | 'IS NOT NULL'
export type OrderDirection = 'ASC' | 'DESC' | 'asc' | 'desc'

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS'

//////////


// type Value = string | number | boolean | null
// type Operator = '=' | '!=' | '<' | '<=' | '>' | '>=' | 'LIKE'

// interface SQLResult {
//   sql: string
//   bindings: Primitives
// }


export interface WhereCondition {
  column: string;
  operator: Operator;
  value: any;
  logical: 'AND' | 'OR';
  not?: boolean;
}

export interface JoinClause {
  type: JoinType;
  table: string;
  first: string;
  operator?: Operator;
  second?: string;
  as?: string;
}

export interface OrderClause {
  column: string;
  direction: OrderDirection;
}

export interface QueryResult {
  sql: string;
  values: any[];
  binds: { [key: string]: any };
  positionalBinds: string[];
}

export interface InsertResult {
  sql: string;
  values: any[];
  binds: { [key: string]: any };
  positionalBinds: string[];
  returning?: string[];
}

export interface UpdateResult {
  sql: string;
  values: any[];
  binds: { [key: string]: any };
  positionalBinds: string[];
}

export interface DeleteResult {
  sql: string;
  values: any[];
  binds: { [key: string]: any };
  positionalBinds: string[];
}

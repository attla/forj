import type {
  D1Database,
  D1PreparedStatement,
  D1Result, D1ExecResult, D1Meta,
} from '@cloudflare/workers-types'

import z from 'zod'

import QueryBuilder from '../query-builder'
import BModel from '../model'
import type {
  DBSchema, SchemaKeys,
  Item,
  Pipe, Result, RunFn,
} from '../types'

export function Model<
  TSchema extends DBSchema,
  TBase extends SchemaKeys<TSchema>
>(schema: TSchema, base: TBase) {
  type S = z.infer<typeof schema>
  return class extends BaseModel<TBase, S> {
    static $table = String(base)
    static $schema = schema
  }
}

export abstract class BaseModel<TB extends keyof DB, DB> extends BModel<TB, DB> {
  static $db: string | D1Database = 'DB'

  static pipe<S, T>(): Pipe<S, T> {
    const db = this.DB()

    return {
      run: this.run<S, T>(db)
    }
  }

  static DB() {
    if (typeof this.$db == 'string') { // TODO: improv compatibility without nodejs_compat
      if (!(this.$db in process.env))
        throw new Error(`Database '${this.$db}' instance not provided.`)

      // @ts-ignore
      return process.env[this.$db] as D1Database
    }

    return this.$db
  }

  static run<S, T>(db: D1Database): RunFn<S, T> {
    return async <S, T, C extends keyof T = keyof T>(
      qb: QueryBuilder<S, T, C>
    ): Promise<Result<T, C>> => {
      let stmt = db.prepare(qb.query)

      if (qb.args?.length)
        stmt = stmt.bind(...qb.args)

      const resp = await stmt.run<Item<T, C>>()

      const meta = resp.meta as any

      return {
        changes: meta?.changes,
        duration: meta?.duration,
        lastId: meta?.last_row_id,
        // served_by: meta?.served_by,
        rowsRead: meta?.rows_read,
        rowsWritten: meta?.rows_written,
        // meta: resp.meta,
        success: resp.success,
        results: resp.results,
      }
    }
  }
}

import * as z from 'zod'
import type { SchemaStructure } from './types'

const m = Symbol('a')
export function isArraySchema(v: any): boolean {
  return v[m] || false
}

export function arraySchema(v: any): any {
  // @ts-ignore
  v[m] = true
  return v
}

function getArrayItem(schema: z.ZodArray<any>): z.ZodTypeAny {
  const def: any = schema._def
  return (def.element ?? def.type ?? def.innerType) as z.ZodTypeAny
}

export function extractZodKeys(schema: z.ZodTypeAny): SchemaStructure {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape

    return Object.entries(shape).map(([key, value]) => {
      const inner = unwrap(value as z.ZodTypeAny)

      if (inner instanceof z.ZodObject)
        return notEmpty(key, extractZodKeys(inner))

      if (inner instanceof z.ZodArray) {
        const item = unwrap(getArrayItem(inner))
        return item instanceof z.ZodObject
          ? notEmpty(key, extractZodKeys(item))
          : key
      }

      return key
    })
  }

  if (schema instanceof z.ZodArray) {
    const item = unwrap(getArrayItem(schema))

    if (item instanceof z.ZodObject)
      return arraySchema(extractZodKeys(item))

    return []
  }

  return []
}

export function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  while (true) {
    if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
      schema = (schema._def as any).innerType
      continue
    }

    if (schema instanceof z.ZodDefault) {
      schema = (schema._def as any).innerType
      continue
    }

    if (schema instanceof z.ZodUnion) {
      const options = (schema._def as any).options as z.ZodTypeAny[]
      const nonEmpty = options.find(
        opt => !(opt instanceof z.ZodUndefined) && !(opt instanceof z.ZodNull)
      )
      schema = nonEmpty ?? options[0]
      continue
    }

    const def: any = schema._def

    // unwrap transforms / pipes do v4
    if (def?.schema) {
      schema = def.schema
      continue
    }

    if (def?.innerType) {
      schema = def.innerType
      continue
    }

    break
  }

  return schema
}

function notEmpty(key: string, schema: SchemaStructure): string | Record<string, SchemaStructure> {
  return schema?.length ? {[key]: schema} : key
}

export function Schema<
  T extends z.ZodTypeAny,
  B extends object
>(
  schema: T,
  BaseClass?: new (...args: any[]) => B
) {
  const Base = (BaseClass || class {})

  return class extends Base {
    static _schema = schema
    static defaultSortKey?: string

    #PK?: string
    #SK?: string

    constructor(data: z.infer<T>) {
      super()
      Object.assign(this, data)
    }

    get PK() { return this.#PK }
    get SK() { return this.#SK }

    static get schema() {
      return extractZodKeys(this._schema)
    }

    static get defaultSK() {
      return this.defaultSortKey
    }

    withKey(key: string, sk?: string) {
      this.#PK = key
      if (sk) this.#SK = sk
      return this
    }
  }
}

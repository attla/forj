import z from 'zod'
import { QueryBuilder } from '@/.'
import type { DBSchema, SchemaKeys } from '@/types'

const user = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  created_at: z.date().or(z.string().datetime()),
  updated_at: z.date().or(z.string().datetime()),
})

const role = z.object({
  id: z.string().uuid(),
  name: z.string(),
  user_id: z.string().uuid().optional(),
})

// const category = z.object({
//   id: z.number(),
//   name: z.string(),
//   type: z.string(),
// })

const Schema = {
  users: user,
  roles: role,
}

const Schema2 = z.object({
  users: user,
  roles: role,
})

function newQB<
  TSchema extends DBSchema,
  TBase extends SchemaKeys<TSchema>
>(table?: TBase, schema?: TSchema) {
  if (schema) {
    type S = z.infer<typeof schema>
    return new QueryBuilder<TBase, S>(String(table), schema)
  }

  return new QueryBuilder<any, any>(table as string || 'users')
}

describe('Query Builder', () => {

  it('SELECT', () => {
    let qb = newQB()

    // select all columns by default
    expect(qb.select().query).toBe('SELECT * FROM users')

    // select explicit columns
    expect(qb.select(['name', 'age']).query).toBe('SELECT name, age FROM users')
    expect(qb.select('email', 'name').query).toBe('SELECT name, age, email FROM users')
    expect(qb.args).toEqual([])

    qb = newQB()

    // select with table prefix and aliases
    expect(qb.select(
      'name',
      'categories.name',
      'category.desc as catDesc'
    ).query).toBe('SELECT name, categories.name AS category_name, category.desc as catDesc FROM users')
    expect(qb.args).toEqual([])

    // select distinct
    qb = newQB()
    expect(
      qb.distinct().select('email').query
    ).toBe('SELECT DISTINCT email FROM users')

    // add table on implicit selects
    const b = 'SELECT users.name AS user_name, categories.name AS category_name FROM users JOIN categories ON categories.id = '
    const q = b + '?'
    expect(newQB().select('name', 'categories.name').join('categories', 'id', 12).query).toBe(q)
    expect((qb = newQB().join('categories', 'id', 12).select('users.name', 'categories.name')).query).toBe(q)
    expect(qb.sql).toBe(b +'12')
    expect(qb.args).toEqual([12])
  })

  it('WHERE', () => {
    let qb = newQB('products')
      .where(q =>
        q.where('name', 'LIKE', '%Smartphone%')
         .orWhere('name', 'LIKE', 'Notebook%')
      ).orWhere(q =>
        q.where('section_id', '>=', '24')
         .orWhere('section_id', '<=', 42)
      ).where(q =>
        q.whereBetween('price', 100, 500)
         .whereNotBetween('stock', 0, 10)
      ).where('user_id', 42)
      .whereIn('category_id', [4, 2])
      .whereNull('soldout')
      .whereNotNull('deleted_at')

    const query = 'SELECT * FROM products WHERE (products.name LIKE ? OR products.name LIKE ?) OR (products.section_id >= ? OR products.section_id <= ?) AND (products.price BETWEEN ? AND ? AND products.stock NOT BETWEEN ? AND ?) AND products.user_id = ? AND products.category_id IN (?, ?) AND products.soldout IS NULL AND products.deleted_at IS NOT NULL'
    const sql = "SELECT * FROM products WHERE (products.name LIKE '%Smartphone%' OR products.name LIKE 'Notebook%') OR (products.section_id >= '24' OR products.section_id <= 42) AND (products.price BETWEEN 100 AND 500 AND products.stock NOT BETWEEN 0 AND 10) AND products.user_id = 42 AND products.category_id IN (4, 2) AND products.soldout IS NULL AND products.deleted_at IS NOT NULL"

    expect(qb.query).toBe(query)
    expect(qb.sql).toBe(sql)
    expect(qb.args).toEqual([
      '%Smartphone%', 'Notebook%', '24', 42, 100, 500, 0, 10, 42, 4, 2,
    ])

    // whereIn with empty array should be ignored
    qb = newQB().whereIn('id', [])
    expect(qb.query).toBe('SELECT * FROM users')

    // with schema validations
    expect(() => newQB('users', Schema).where('id', 42)).toThrow()
    expect(() => newQB('users', Schema).where('type', 42)).toThrow()
  })

  it('JOIN', () => {
    let qb = newQB()
      .join('roles', join =>
        // join.where('users.id', 'roles.user_id')
        join.where('roles.user_id', 'users.id')
      ).leftJoin('categories', join =>
        join.where('id', 42)
         .where('type', '!=', '24')
      ).innerJoin('goals', j => j.where('user_id', 'users.id').where(join =>
        join.whereIn('type', [4, '2'])
         .orWhereNotIn('type', [3, '1'])
         .orWhereNull('end')
      ))//.rightJoin('files', 'user_id', 'id')

    const query = 'SELECT * FROM users JOIN roles ON roles.user_id = users.id LEFT JOIN categories ON categories.id = ? AND categories.type != ? INNER JOIN goals ON goals.user_id = users.id AND (goals.type IN (?, ?) OR goals.type NOT IN (?, ?) OR goals."end" IS NULL)'
    const sql = `SELECT * FROM users JOIN roles ON roles.user_id = users.id LEFT JOIN categories ON categories.id = 42 AND categories.type != '24' INNER JOIN goals ON goals.user_id = users.id AND (goals.type IN (4, '2') OR goals.type NOT IN (3, '1') OR goals."end" IS NULL)`

    expect(qb.query).toBe(query)
    expect(qb.sql).toBe(sql)
    expect(qb.args).toEqual([42, '24', 4, '2', 3, '1'])

    // schema validations
    expect(() => newQB('users', Schema).join('roles', 'id', 42)).toThrow()


    // const b = (type?: string) => `SELECT * FROM users ${type ? type + ' ' : ''}JOIN roles ON roles.user_id = users.id`
    const b = 'SELECT * FROM users JOIN roles ON roles.user_id = '
    const q = b +'users.id'
    const q2 = b +'42'
    const q3 = b +'?'

    // qb = newQB().join('roles', 'user_id', 42)
    // expect(qb.query).toBe(q)
    // expect(qb.sql).toBe(q2)

    // qb = newQB().join('roles', 'user_id', '=', 42)
    // expect(qb.query).toBe(q)
    // expect(qb.sql).toBe(q2)

    const cases = [
      ['user_id', 42, q3, q2],
      ['user_id', '=', 42, q3, q2],
      ['user_id', 'users', 'id', q, q],
      ['user_id', '=', 'users', 'id', q, q],
      // ['user_id', 'users', 42, q, q2], // error   // roles.user_id = users.42
      // ['user_id', '=', 'id', 42, q, q2], // error // roles.user_id = id.42
    ]

    cases.forEach(args => {
      const sql = args.pop() // @ts-ignore
      const query = args.pop() // @ts-ignore
      const builder = newQB().join('roles', ...args)
      // const builder = newQB('users', Schema).join('roles', ...args)
      expect(builder.query).toBe(query as string)
      expect(builder.sql).toBe(sql as string)
    })

    // TODO: test all usage options

    // .join('table', 'column', 'value') ✅
    // .join('table', 'column', 'operator', 'value') ✅
    // .join('table', 'column', 'table2', 'column2') ✅
    // .join('table', 'column', operator', 'table2', 'column2') ✅
  })

  // it('Aggregations', () => {

  //   //'group by and having'
  //   const qb = new QueryBuilder('orders')
  //     .select('user_id', 'COUNT(*) as total')
  //     .groupBy('user_id')
  //     .having('total', '>', 5) // precisa implementar

  //   expect(qb.query).toBe('SELECT user_id, COUNT(*) as total FROM orders GROUP BY user_id HAVING total > ?')
  // })

  it('ORDER', () => {
    const b = 'SELECT * FROM users ORDER BY name '
    const q = b + 'ASC'
    const q2 = b + 'DESC'

    const asc = newQB().asc('name')
    expect(asc.query).toBe(q)

    const order = newQB().order('name')
    expect(order.query).toBe(q)

    const orderBy = newQB().orderBy('name')
    expect(orderBy.query).toBe(q)

    const desc = newQB().desc('name')
    expect(desc.query).toBe(q2)

    const orderDesc = newQB().order('name', 'desc')
    expect(orderDesc.query).toBe(q2)

    const orderByDesc = newQB().orderBy('name', 'DESC')
    expect(orderByDesc.query).toBe(q2)

    expect(newQB().asc('users.name').query).toBe('SELECT * FROM users ORDER BY users.name ASC')
  })

  it('LIMIT && OFFSET', () => {
    const b = 'SELECT * FROM users LIMIT 10 OFFSET '
    const q = b +'20'
    const cases = [
      [10, '20', q],
      [10.6, '20.5', q],
      [10.6, 'abc', b +'0'],
      ['abc', '20?g=', 'SELECT * FROM users OFFSET 20'],
    ]

    cases.forEach(([limit, offset, sql]) => {
      const qb = newQB().limit(limit).offset(offset)
      expect(qb.query).toBe(sql as string)
    })
  })

})

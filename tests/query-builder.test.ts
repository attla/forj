import QueryBuilder from '@/query-builder'

describe('Query Builder', () => {
  it('SELECT', () => {

    let qb = new QueryBuilder('users')

    expect(qb.select().toSQL()).toBe('SELECT * FROM users')

    expect(qb.select(['name', 'age']).toSQL()).toBe('SELECT name, age FROM users')
    expect(qb.select('email', 'name').toSQL()).toBe('SELECT name, age, email FROM users')

    qb = new QueryBuilder('users')

    expect(qb.select(
      'name',
      'category.name',
      'category.desc as catDesc'
    ).toSQL()).toBe('SELECT name, category.name AS category_name, category.desc as catDesc FROM users')
  })

  it('WHERE', () => {
    let qb = new QueryBuilder('users')
      .where(q =>
        q.where('name', 'LIKE', '%Smartphone%')
         .orWhere('name', 'LIKE', 'Notebook%')
      ).orWhere(q =>
        q.where('section_id', '>=', '24')
         .orWhere('section_id', '<=', 42)
      )
      .where('user_id', 42)
      .whereIn('category_id', [4, 2])
      .whereNull('soldout')
      .whereNotNull('deleted_at')
      // .whereBetween('price', 500, 20000)

    const sql = 'SELECT * FROM users WHERE (users.name LIKE ? OR users.name LIKE ?) OR (users.section_id >= ? OR users.section_id <= ?) AND users.user_id = ? AND users.category_id IN (?, ?) AND users.soldout IS NULL AND users.deleted_at IS NOT NULL'
    const rawSql = "SELECT * FROM users WHERE (users.name LIKE '%Smartphone%' OR users.name LIKE 'Notebook%') OR (users.section_id >= '24' OR users.section_id <= 42) AND users.user_id = 42 AND users.category_id IN (4, 2) AND users.soldout IS NULL AND users.deleted_at IS NOT NULL"

    expect(qb.toSQL()).toBe(sql)
    expect(qb.rawSql()).toBe(rawSql)
  })

  it('JOIN', () => {
    let qb = new QueryBuilder('users')
      .join('roles', join =>
        // join.where('users.id', 'roles.user_id')
        join.where('roles.user_id', 'users.id')
      )
      .leftJoin('categories', join =>
        join.where('id', 42)
         .where('type', '!=', '24')
      ).innerJoin('goals', j => j.where('user_id', 'users.id').where(join =>
        join.whereIn('type', [4,'2'])
         .orWhereNull('end')
      ))

    const sql = 'SELECT * FROM users JOIN roles ON roles.user_id = users.id LEFT JOIN categories ON categories.id = ? AND categories.type != ? INNER JOIN goals ON goals.user_id = users.id AND (goals.type IN (?, ?) OR goals.end IS NULL)'
    const rawSql = "SELECT * FROM users JOIN roles ON roles.user_id = users.id LEFT JOIN categories ON categories.id = 42 AND categories.type != '24' INNER JOIN goals ON goals.user_id = users.id AND (goals.type IN (4, '2') OR goals.end IS NULL)"

    expect(qb.toSQL()).toBe(sql)
    expect(qb.rawSql()).toBe(rawSql)
  })

  // offset

})

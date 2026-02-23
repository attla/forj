import { Schema, Blueprint } from '@/migrations'
import { tableName, tableSlug } from '@/utils'

describe('Migrations', () => {
  const result = {
    create: ` (
  id INTEGER PRIMARY KEY,
  username VARCHAR DEFAULT '\\'guest\\'',
  email VARCHAR(200) NOT NULL UNIQUE,
  bio TEXT,
  age INTEGER NOT NULL,
  followers_count INTEGER NOT NULL DEFAULT 0,
  score REAL NOT NULL,
  balance NUMERIC NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_verified INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  deleted_at INTEGER,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user', 'guest')),
  score INTEGER NOT NULL DEFAULT 0 CHECK(score IN (0, 1, 2, 3, 4, 5)),
  avatar BLOB NOT NULL,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE ON UPDATE RESTRICT,
  app_id INTEGER,
  KEY users_username_index (username),
  UNIQUE KEY users_email_unique (email),
  PRIMARY KEY (id),
  KEY full_name_index (first_name, last_name),
  UNIQUE KEY unique_email_username (email, username),
  PRIMARY KEY (id, tenant_id),
  FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
);`,
    drop: 'DROP TABLE users;',
    dropIfExists: 'DROP TABLE IF EXISTS users;',
    dropView: 'DROP VIEW [users];',
    dropViewIfExists: 'DROP VIEW IF EXISTS [users];',
  }

  const fn = {
    create: (table: Blueprint) => {
      table.id() // Primary key
      table.string('username').nullable().default("'guest'")
      table.string('email', 200).unique()
      table.text('bio').nullable()
      table.int('age')
      table.integer('followers_count').unsigned().default(0)
      table.real('score')
      table.numeric('balance')
      table.boolean('is_active').default(1)
      table.boolean('is_verified').default(false)

      // table.bigInteger('visits')
      // table.tinyInteger('status')
      // table.decimal('price', 10, 2)
      // table.float('rating')
      // table.double('latitude')

      // Date/Time columns
      // table.date('birth_date')
      // table.dateTime('last_login')
      // table.timestamp('email_verified_at')
      // table.time('open_time')
      // Timestamps and soft deletes
      table.timestamps() // created_at, updated_at int
      table.timestamps('date') // created_at, updated_at datetime
      table.softDeletes() // deleted_at

      table.enum('role', ['admin', 'user', 'guest']).default('user')
      table.enum('score', [0, 1, 2, 3, 4, 5]).default(0)
      // table.enum('rate', [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]).default(0) // TODO: problematic..
      table.blob('avatar') // TODO: needs a deeep test..

      table.foreignId('role_id').nullable() // TODO: resolve problems on ALTER TABLE..
// CREATE TABLE table_new_pk (
// id INTEGER PRIMARY KEY,

// app_id INTEGER NOT NULL,

// name TEXT,

// FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
// );

// -- 2. Copy data:
// INSERT INTO table_new_pk (id, app_id, name)
// SELECT id, app_id, name FROM tabela_filha;

// -- 3. Remove the old table:
// -- DROP TABLE tabela_filha;

// -- 4. Rename the new table:
// -- ALTER TABLE table_new_pk RENAME TO tabela_filha;

      table.int('app_id').nullable()
      table.foreign('app_id')
        .references('id')
        .on('apps')
        .onDelete('CASCADE')
        // .onUpdate('restrict')

      // Composite foreign key
      // table.foreign(['user_id', 'team_id'])
      //   .references(['id', 'team_id'])
      //   .on('user_teams')

      // Indexes (single column)
      table.index('username')
      table.unique('email')
      table.primary('id')
      table.index(['first_name', 'last_name'], 'full_name_index')
      table.unique(['email', 'username'], 'unique_email_username')
      table.primary(['id', 'tenant_id'])
    },
  }

  const cases = [
    ['create', ['users', fn.create], 'CREATE TABLE users'+ result.create],
    ['createIfNotExists', ['db users', fn.create], 'CREATE TABLE IF NOT EXISTS "db users"'+ result.create.replaceAll('users_', 'db_users_')],
    ['drop', ['users'], result.drop],
    ['dropIfExists', ['users'], result.dropIfExists],
    ['dropView', ['users'], result.dropView],
    ['dropViewIfExists', ['users'], result.dropViewIfExists],
  ] as const

  cases.forEach(([method, args, sql]) => {
    it(method.replace(/([A-Z])/g, ' $1').toUpperCase(), () => {
      Schema.clearStatements() // @ts-ignore
      Schema[method](...args)
      expect(Schema.sql).toBe(sql)
    })
  })

})

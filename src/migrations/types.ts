import { Blueprint } from './blueprint'
// import { Migration } from './migration'

export type BlueprintFn = (table: Blueprint) => void


// TODO: refactor bellow

export type ColumnDefinition = {
  name: string,
  type: string,
  length?: number,
  nullable?: boolean,
  unique?: boolean,
  primary?: boolean,
  autoIncrement?: boolean,
  default?: any,
  unsigned?: boolean,
  index?: boolean,
  comment?: string,
  raw?: string,
  references?: string,
  on?: string,
  onDelete?: ForeignKeyAction,
  onUpdate?: ForeignKeyAction,
}

export type IndexDefinition = {
  columns: string[],
  type: 'index' | 'unique' | 'primary',
  name?: string,
}

export type ForeignKeyDefinition = {
  name: string,
  references: string,
  on: string,
  onDelete?: ForeignKeyAction,
  onUpdate?: ForeignKeyAction,
}

export type QueueType = 'pending' | 'migrated'
export type Queue = Record<QueueType, MigrationInfo[]>

export type MigrationInfo = {
  timestamp: number,
  name: string,
  className: string,
  handler: MigrationClass,
  input: string,
  output: string,
  migrated: boolean,
}

export type MigrationRecord = {
  migration: string;
  batch: number;
  executed_at: Date;
}

export type MigrationClass = {
  // new (): MigrationClass;
  // new(): Migration;
  // up(): Promise<void>;
  // down(): Promise<void>;
  run(): Promise<void>
  // toSQL?(): Promise<string>;
  // getMigrationName?(): string;
}

export type ForeignKeyAction = 'cascade' | 'set null' | 'restrict' | 'no action' | 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'

// export interface SchemaConnection {
//   execute(sql: string): Promise<any>,
//   query(sql: string): Promise<any[]>,
// }

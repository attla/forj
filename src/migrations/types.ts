import { Blueprint } from './blueprint'
import { Migration } from './migration'

export type BlueprintFn = (table: Blueprint) => void


// TODO: refactor bellow

export interface ColumnDefinition {
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
}

export interface IndexDefinition {
  columns: string[],
  type: 'index' | 'unique' | 'primary',
  name?: string,
}

export interface ForeignKeyDefinition {
  column: string,
  references: string,
  on: string,
  onDelete?: 'cascade' | 'set null' | 'restrict' | 'no action',
  onUpdate?: 'cascade' | 'set null' | 'restrict' | 'no action',
}

export interface MigrationInfo {
  timestamp: number,
  name: string,
  fileName: string,
  className: string,
  handler: MigrationClass,
}

export interface MigrationRecord {
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

// export interface SchemaConnection {
//   execute(sql: string): Promise<any>,
//   query(sql: string): Promise<any[]>,
// }

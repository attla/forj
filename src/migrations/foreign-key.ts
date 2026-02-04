import type { ForeignKeyDefinition } from './types'

export default class ForeignKey {
  constructor(private fk: ForeignKeyDefinition) {}

  references(column: string) {
    this.fk.references = column
    return this
  }

  on(table: string) {
    this.fk.on = table
    return this
  }

  onDelete(action: 'cascade' | 'set null' | 'restrict' | 'no action') {
    this.fk.onDelete = action;
    return this;
  }

  onUpdate(action: 'cascade' | 'set null' | 'restrict' | 'no action') {
    this.fk.onUpdate = action
    return this
  }
}

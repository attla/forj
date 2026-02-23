import type { ForeignKeyDefinition, ForeignKeyAction } from './types'

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

  onDelete(action: ForeignKeyAction) {
    this.fk.onDelete = action;
    return this;
  }

  onUpdate(action: ForeignKeyAction) {
    this.fk.onUpdate = action
    return this
  }
}

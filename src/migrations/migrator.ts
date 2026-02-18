import glob from 'tiny-glob'
import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { Datte, IMPORT } from 't0n'
import { Schema } from './schema'
import { MigrationInfo, MigrationClass, Queue } from './types'

const __root = resolve(dirname(new URL(import.meta.url).pathname), '../../../..')

export class Migrator {
  static #input = join(__root, 'migrations')
  static #output = join(__root, 'migrations', 'sql')
  static #createPatterns = [
    /^create_(\w+)_table$/,
    /^create_(\w+)$/,
  ]
  static #changePatterns = [
    /.+_(to|from|in)_(\w+)_table$/,
    /.+_(to|from|in)_(\w+)$/,
  ]

  static inputDir(dir: string) {
    this.#input = join(__root, dir)
    return this
  }
  static outputDir(dir: string) {
    this.#output = join(__root, dir)
    return this
  }

  static async queue() {
    this.#ensureDir(this.#input)
    const files = await glob(join(this.#input, '/*.{ts,js}'))
    const list: Queue = {pending: [], migrated: []}

    for (const file of files) {
      if (file.includes('.d.')) continue
      const info = await this.#info(file)
      if (!info) continue // TODO: trigger a warn

      list[info.migrated ? 'migrated' : 'pending'].push(info)
    }

    return list
  }

  static async compile(migrations: MigrationInfo[]) {
    for (const migration of migrations) {
      const sql = await this.run(migration.handler)
      if (!existsSync(migration.output))
        writeFileSync(migration.output, `-- Migration: ${migration.name}\n\n${sql}\n`)
    }
  }

  static async run(handler: MigrationClass) {
    //  try {
    //     await migrationClass.up()
    //   } catch (error) {
    //     // Try run() if up() is not implemented
    //     if (migrationClass.run) {
    //       await migrationClass.run()
    //     } else {
    //       throw error
    //     }
    //  }

    if (!handler?.run) return ''
    Schema.clearStatements()
    await handler.run()
    return Schema.sql
  }

  static async #info(fileName: string): Promise<MigrationInfo | null> {
    let name = fileName.replace(/\.[jt]s$/, '')
    const match = name.match(/\/(\d{4})_(\d{2})_(\d{2})_(\d{2})(\d{2})(\d{2})_(.+)$/)
    name = name.split('/').at(-1) as string

    if (!match) return null
    const [, year, month, day, hour, minute, second, slugName] = match

    const input = join(__root, fileName)
    const output = join(this.#output, name +'.sql')
    const mod = await IMPORT(input)
    const handler = mod.default as MigrationClass

    return {
      timestamp: new Date(
        parseInt(year),
        parseInt(month) - 1, // Js months are 0-indexed
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      ).getTime(),
      name,
      className: this.className(slugName),
      handler,
      input,
      output,
      migrated: existsSync(output)
    }
  }

  static guess(name: string): [string, boolean] {
    for (const pattern of this.#createPatterns) {
      const match = name.match(pattern)
      if (match) return [match[1], true]
    }

    for (const pattern of this.#changePatterns) {
      const match = name.match(pattern)
      if (match) return [match[2], false]
    }

    return ['', false]
  }

  static className(name: string) {
    const lastSlashIndex = name.lastIndexOf('/')
    const fileName = lastSlashIndex >= 0 ? name.substring(lastSlashIndex + 1) : name

    const dotIndex = fileName.lastIndexOf('.')
    const baseName = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName

    return baseName
      .split(/[-_.]/)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join('')
      + Datte.dateTime().replace(/[:.\-\s_]/g, '')
  }

  static fileName(name: string) {
    return (
      Datte.dateTime().replace(/[.-\s]/g, '_').replace(/\:/g, '')
      +'_'+ name.replace(/([A-Z])/g, '_$1') // snake_case
          .replace(/\s+/g, '_')
          .toLowerCase()
    ).replace(/_+/g, '_')
  }

  static #ensureDir(dir: string) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
}

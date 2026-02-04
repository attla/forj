import glob from 'tiny-glob'
import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { Datte, IMPORT } from 't0n'
import { Schema } from './schema'
import { MigrationInfo, MigrationClass } from './types'

const __root = resolve(dirname(new URL(import.meta.url).pathname), '../../../..')

export class Migrator {
  static #dir: string = ''
  static #folder: string = 'migrations'
  static #sqlFolder: string = 'sql'

  static dir(dir: string) {
    this.#dir = dir
    return this
  }

  static folder(dir: string) {
    this.#dir = dir
    return this
  }

  static async toSql(outputDir: string = '') {
    const dir = this.#dir || join(__root, this.#folder)
    outputDir ||= join(dir, this.#sqlFolder)

    this.#ensureDir(dir)
    this.#ensureDir(outputDir)
    const files = (await glob(join(dir, '/*.{ts,js}'))).filter(file => !file.includes('.d.')) // TODO: sort

    for (const file of files) {
      const info = await this.#info(file)
      if (!info)
        continue // TODO: trigger a warn

      const sql = await this.run(info.handler)
      const path = join(outputDir, info.name +'.sql')
      if (!existsSync(path))
        writeFileSync(path, `-- Migration: ${info.name}\n\n${sql}\n`)
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
    const name = fileName.replace(/\.[jt]s$/, '')
    const match = name.match(/\/(\d{4})_(\d{2})_(\d{2})_(\d{2})(\d{2})(\d{2})_(.+)$/)

    if (!match) return null
    const [, year, month, day, hour, minute, second, slugName] = match

    const mod = await IMPORT(join(__root, fileName))
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
      name: name.split('/').at(-1) as string,
      fileName,
      className: this.#toClassName(slugName),
      handler,
    }
  }

  static #toClassName(name: string) {
    return name
      .split(/[-_.]/)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join('')
  }

  static fileName(name: string) {
    return (
      name.replace(/([A-Z])/g, '_$1') // snake_case
          .replace(/\s+/g, '_')
          .toLowerCase()
      + '_'
      + Datte.dateTime().replace(/[:.-]/g, '_').replace(/_+/g, '_')
    ).replace(/^_+|_+$/g, '')
  }

  static #ensureDir(dir: string) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
}

import { defineConfig } from 'tsup'
import glob from 'tiny-glob'
import { relative } from 'node:path'

const files = await glob('src/**/index.ts')
const entries = Object.fromEntries(files.map(file => {
  const path = relative('src', file).replace('/index.ts', '')
  return [path == '' ? 'index' : path, file]
}))

export default defineConfig({
  entry: entries,
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  dts: true,
  sourcemap: false,
  clean: true,
  treeshake: true,
  // minify: true,
  minify: 'terser',
  removeNodeProtocol: false,
  // silent: true,
})

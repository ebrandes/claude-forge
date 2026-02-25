import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts', 'bin/claude-forge.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: false,
})

import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { detectStack } from './detect-stack.js'

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'detect-stack-'))
}

async function writePackageJson(
  dir: string,
  deps: Record<string, string> = {},
  devDeps: Record<string, string> = {},
): Promise<void> {
  await writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({ dependencies: deps, devDependencies: devDeps }),
  )
}

async function writeComposerJson(
  dir: string,
  require: Record<string, string> = {},
  requireDev: Record<string, string> = {},
): Promise<void> {
  await writeFile(
    path.join(dir, 'composer.json'),
    JSON.stringify({ require, 'require-dev': requireDev }),
  )
}

describe('detectStack', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempDir()
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('returns empty result for empty directory', async () => {
    const result = await detectStack(tempDir)

    expect(result.framework).toBeNull()
    expect(result.language).toBeNull()
    expect(result.presetSuggestion).toBeNull()
    expect(result.dependencies).toEqual([])
    expect(result.hasTypeScript).toBe(false)
    expect(result.substacks).toEqual([])
  })

  it('detects Next.js with TypeScript', async () => {
    await writePackageJson(tempDir, { next: '^14.0.0' }, { typescript: '^5.0.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('Next.js')
    expect(result.language).toBe('TypeScript')
    expect(result.presetSuggestion).toBe('next-app')
    expect(result.hasTypeScript).toBe(true)
  })

  it('detects Next.js with JavaScript', async () => {
    await writePackageJson(tempDir, { next: '^14.0.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('Next.js')
    expect(result.language).toBe('JavaScript')
    expect(result.presetSuggestion).toBe('next-app')
  })

  it('detects Fastify', async () => {
    await writePackageJson(tempDir, { fastify: '^4.0.0' }, { typescript: '^5.0.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('Fastify')
    expect(result.presetSuggestion).toBe('fastify-api')
  })

  it('detects React Native', async () => {
    await writePackageJson(tempDir, { 'react-native': '^0.72.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('React Native')
    expect(result.presetSuggestion).toBe('react-native')
  })

  it('detects React with Vite', async () => {
    await writePackageJson(tempDir, { react: '^18.0.0' }, { vite: '^5.0.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('React (Vite)')
    expect(result.presetSuggestion).toBe('react-spa')
  })

  it('detects Flutter via pubspec.yaml', async () => {
    await writeFile(path.join(tempDir, 'pubspec.yaml'), 'name: my_app')

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('Flutter')
    expect(result.language).toBe('Dart')
    expect(result.presetSuggestion).toBe('flutter-app')
  })

  it('detects monorepo via pnpm-workspace.yaml', async () => {
    await writePackageJson(tempDir, { react: '^18.0.0' }, { vite: '^5.0.0' })
    await writeFile(path.join(tempDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*')

    const result = await detectStack(tempDir)

    expect(result.presetSuggestion).toBe('monorepo')
  })

  it('detects Express as Node.js API', async () => {
    await writePackageJson(tempDir, { express: '^4.0.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('Node.js API')
    expect(result.presetSuggestion).toBe('fastify-api')
  })

  it('detects Expo as React Native', async () => {
    await writePackageJson(tempDir, { expo: '^49.0.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('React Native')
    expect(result.presetSuggestion).toBe('react-native')
  })

  it('collects all dependencies', async () => {
    await writePackageJson(tempDir, { next: '^14.0.0', react: '^18.0.0' }, { typescript: '^5.0.0' })

    const result = await detectStack(tempDir)

    expect(result.dependencies).toContain('next')
    expect(result.dependencies).toContain('react')
    expect(result.dependencies).toContain('typescript')
  })

  it('detects monorepo via lerna.json', async () => {
    await writePackageJson(tempDir, { react: '^18.0.0' })
    await writeFile(path.join(tempDir, 'lerna.json'), '{}')

    const result = await detectStack(tempDir)

    expect(result.presetSuggestion).toBe('monorepo')
  })

  it('returns no framework when only devDeps exist', async () => {
    await writePackageJson(tempDir, {}, { eslint: '^8.0.0', prettier: '^3.0.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBeNull()
    expect(result.presetSuggestion).toBeNull()
    expect(result.dependencies).toContain('eslint')
  })

  // ─── PHP Detection ───

  it('detects PHP via composer.json', async () => {
    await writeComposerJson(tempDir, { php: '>=8.1' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('PHP')
    expect(result.language).toBe('PHP')
    expect(result.presetSuggestion).toBe('php-api')
    expect(result.substacks).toHaveLength(1)
    expect(result.substacks[0].path).toBe('.')
  })

  it('detects Laravel via artisan file', async () => {
    await writeComposerJson(tempDir, { php: '>=8.1' })
    await writeFile(path.join(tempDir, 'artisan'), '#!/usr/bin/env php')

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('Laravel')
    expect(result.presetSuggestion).toBe('php-api')
  })

  it('detects Laravel via laravel dependencies', async () => {
    await writeComposerJson(tempDir, { 'laravel/framework': '^11.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('Laravel')
  })

  it('detects Symfony via symfony dependencies', async () => {
    await writeComposerJson(tempDir, { 'symfony/framework-bundle': '^7.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('Symfony')
  })

  it('detects PHP tools (PHPStan, Pest, Pint)', async () => {
    await writeComposerJson(
      tempDir,
      { 'laravel/framework': '^11.0' },
      { 'phpstan/phpstan': '^1.0', 'pestphp/pest': '^2.0', 'laravel/pint': '^1.0' },
    )

    const result = await detectStack(tempDir)

    expect(result.substacks[0].tools).toContain('phpstan')
    expect(result.substacks[0].tools).toContain('pest')
    expect(result.substacks[0].tools).toContain('pint')
  })

  // ─── Multi-Stack Detection ───

  it('detects PHP + Vite in separate subfolders', async () => {
    const backend = path.join(tempDir, 'backend')
    const frontend = path.join(tempDir, 'frontend')
    await mkdir(backend)
    await mkdir(frontend)

    await writeComposerJson(backend, { 'laravel/framework': '^11.0' })
    await writeFile(path.join(backend, 'artisan'), '#!/usr/bin/env php')
    await writePackageJson(frontend, { react: '^18.0.0' }, { vite: '^5.0.0', typescript: '^5.0.0' })

    const result = await detectStack(tempDir)

    expect(result.substacks).toHaveLength(2)
    expect(result.presetSuggestion).toBe('php-vite')

    const phpStack = result.substacks.find((s) => s.language === 'PHP')
    const jsStack = result.substacks.find((s) => s.language === 'TypeScript')

    expect(phpStack?.framework).toBe('Laravel')
    expect(phpStack?.path).toBe('backend')
    expect(jsStack?.framework).toBe('React (Vite)')
    expect(jsStack?.path).toBe('frontend')
  })

  it('detects substacks with tools info', async () => {
    const api = path.join(tempDir, 'api')
    await mkdir(api)

    await writeComposerJson(
      api,
      { php: '>=8.1' },
      { 'phpunit/phpunit': '^10.0', 'friendsofphp/php-cs-fixer': '^3.0' },
    )

    const result = await detectStack(tempDir)

    const phpStack = result.substacks.find((s) => s.language === 'PHP')
    expect(phpStack?.tools).toContain('phpunit')
    expect(phpStack?.tools).toContain('php-cs-fixer')
  })

  it('ignores node_modules and vendor directories', async () => {
    await mkdir(path.join(tempDir, 'node_modules'))
    await mkdir(path.join(tempDir, 'vendor'))
    await writePackageJson(path.join(tempDir, 'node_modules'), { next: '^14.0.0' })
    await writeComposerJson(path.join(tempDir, 'vendor'), { 'laravel/framework': '^11.0' })

    const result = await detectStack(tempDir)

    expect(result.substacks).toHaveLength(0)
  })
})

import path from 'node:path'

import { readJsonFile, fileExists } from './fs.js'

export interface DetectedStack {
  framework: string | null
  language: string | null
  presetSuggestion: string | null
  dependencies: string[]
  hasTypeScript: boolean
}

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

export async function detectStack(projectDir: string): Promise<DetectedStack> {
  const result: DetectedStack = {
    framework: null,
    language: null,
    presetSuggestion: null,
    dependencies: [],
    hasTypeScript: false,
  }

  const packageJson = await readJsonFile<PackageJson>(path.join(projectDir, 'package.json'))
  const hasPubspec = await fileExists(path.join(projectDir, 'pubspec.yaml'))

  if (hasPubspec) {
    result.framework = 'Flutter'
    result.language = 'Dart'
    result.presetSuggestion = 'flutter-app'
    return result
  }

  if (!packageJson) return result

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }
  result.dependencies = Object.keys(allDeps)
  result.hasTypeScript = 'typescript' in allDeps

  if ('next' in allDeps) {
    result.framework = 'Next.js'
    result.language = result.hasTypeScript ? 'TypeScript' : 'JavaScript'
    result.presetSuggestion = 'next-app'
  } else if ('fastify' in allDeps) {
    result.framework = 'Fastify'
    result.language = result.hasTypeScript ? 'TypeScript' : 'JavaScript'
    result.presetSuggestion = 'fastify-api'
  } else if ('react-native' in allDeps || 'expo' in allDeps) {
    result.framework = 'React Native'
    result.language = result.hasTypeScript ? 'TypeScript' : 'JavaScript'
    result.presetSuggestion = 'react-native'
  } else if ('react' in allDeps && 'vite' in allDeps) {
    result.framework = 'React (Vite)'
    result.language = result.hasTypeScript ? 'TypeScript' : 'JavaScript'
    result.presetSuggestion = 'react-spa'
  } else if ('react' in allDeps) {
    result.framework = 'React'
    result.language = result.hasTypeScript ? 'TypeScript' : 'JavaScript'
    result.presetSuggestion = 'react-spa'
  } else if ('express' in allDeps || 'hono' in allDeps || 'koa' in allDeps) {
    result.framework = 'Node.js API'
    result.language = result.hasTypeScript ? 'TypeScript' : 'JavaScript'
    result.presetSuggestion = 'fastify-api'
  }

  const hasWorkspaces =
    (await fileExists(path.join(projectDir, 'pnpm-workspace.yaml'))) ||
    (await fileExists(path.join(projectDir, 'lerna.json')))
  if (hasWorkspaces) {
    result.presetSuggestion = 'monorepo'
  }

  return result
}

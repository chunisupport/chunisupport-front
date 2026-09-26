import { access } from 'node:fs/promises'
import { dirname, extname, resolve as resolvePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const isRelativeOrAbsoluteSpecifier = (specifier) =>
  specifier.startsWith('./') || specifier.startsWith('../') || specifier.startsWith('/')

const hasExtension = (specifier) => extname(specifier) !== ''

export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve)
  } catch (error) {
    if (
      !['ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT'].includes(error?.code) ||
      !isRelativeOrAbsoluteSpecifier(specifier) ||
      hasExtension(specifier) ||
      !context.parentURL
    ) {
      throw error
    }

    const parentPath = fileURLToPath(context.parentURL)
    // TypeScript と同様に、拡張子省略とディレクトリの index を解決する。
    for (const suffix of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
      const candidatePath = resolvePath(dirname(parentPath), `${specifier}${suffix}`)
      try {
        await access(candidatePath)
        return defaultResolve(pathToFileURL(candidatePath).href, context, defaultResolve)
      } catch {}
    }
    throw error
  }
}

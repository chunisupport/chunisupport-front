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
      error?.code !== 'ERR_MODULE_NOT_FOUND' ||
      !isRelativeOrAbsoluteSpecifier(specifier) ||
      hasExtension(specifier) ||
      !context.parentURL
    ) {
      throw error
    }

    const parentPath = fileURLToPath(context.parentURL)
    for (const ext of ['.ts', '.tsx']) {
      const candidatePath = resolvePath(dirname(parentPath), `${specifier}${ext}`)
      try {
        await access(candidatePath)
        return defaultResolve(pathToFileURL(candidatePath).href, context, defaultResolve)
      } catch {}
    }
    throw error
  }
}

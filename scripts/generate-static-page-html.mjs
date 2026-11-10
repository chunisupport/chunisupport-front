import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadEnv } from '@rsbuild/core'
import { buildDocumentTitle } from '../src/constants/site.ts'
import { STATIC_PAGE_METADATA } from '../src/constants/staticPageMetadata.ts'
import {
  createStaticPageHtml,
  resolvePublicUrl,
  resolveStaticPageOutputPath,
} from '../src/utils/staticPageHtml.ts'

const DIST_DIRECTORY = path.resolve(import.meta.dirname, '../dist')
const INDEX_HTML_PATH = path.join(DIST_DIRECTORY, 'index.html')
const OGP_PUBLIC_PATH = '/ogp.png'

/**
 * OGP なしの SPA HTML を基に、固定ページ専用の初期 HTML を生成する。
 *
 * @returns 生成処理の完了を表す Promise。
 */
const generateStaticPageHtml = async () => {
  const envResult = loadEnv({ mode: 'production', prefixes: ['PUBLIC_'] })
  const frontendBaseUrl = envResult.rawPublicVars.PUBLIC_FRONTEND_URL
  envResult.cleanup()

  if (!frontendBaseUrl) {
    throw new Error('PUBLIC_FRONTEND_URL が設定されていません。')
  }

  const template = await readFile(INDEX_HTML_PATH, 'utf8')
  const pagePaths = STATIC_PAGE_METADATA.map((page) => page.path)
  if (new Set(pagePaths).size !== pagePaths.length) {
    throw new Error('固定ページのパスが重複しています。')
  }

  await Promise.all(
    STATIC_PAGE_METADATA.map(async (page) => {
      const outputPath = resolveStaticPageOutputPath(DIST_DIRECTORY, page.path)
      const html = createStaticPageHtml(template, {
        title: page.path === '/' ? page.title : buildDocumentTitle(page.title),
        description: page.description,
        canonicalUrl: resolvePublicUrl(page.path, frontendBaseUrl),
        imageUrl: resolvePublicUrl(OGP_PUBLIC_PATH, frontendBaseUrl),
      })

      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, html, 'utf8')
    })
  )
}

await generateStaticPageHtml()

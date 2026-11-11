import { appendFile, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { loadEnv } from '@rsbuild/core'
import {
  CLOUDFLARE_PAGES_HEADER_RULE_LIMIT,
  collectNonHtmlHeaderPaths,
  countCloudflareHeaderRules,
  createEarlyHintsHeaderRules,
} from '../src/utils/earlyHints.ts'

const DIST_DIRECTORY = path.resolve(import.meta.dirname, '../dist')
const INDEX_HTML_PATH = path.join(DIST_DIRECTORY, 'index.html')
const HEADERS_PATH = path.join(DIST_DIRECTORY, '_headers')

/**
 * dist 内のファイルを、`/` 区切りの相対パスとして列挙する。
 *
 * @returns `dist` からの相対パス。
 */
const readDistRelativePaths = async () => {
  const entries = await readdir(DIST_DIRECTORY, { recursive: true, withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const relativePath = path.relative(DIST_DIRECTORY, path.join(entry.parentPath, entry.name))
      return relativePath.split(path.sep).join('/')
    })
}

/**
 * ビルド済み HTML が初期表示で読む CSS / JS と、API オリジンへの preconnect を
 * Cloudflare Pages の `dist/_headers` に追記する。
 *
 * `/static/` のフォント CSS も初期スタイルシートとして preload する。外部の Google Fonts へは出さない。
 * ハッシュ付きファイル名はビルドごとに変わるため、静的な `public/_headers` には書かない。
 * 既存の Cache-Control とセキュリティヘッダーは別規則のまま残し、非 HTML から Link だけを外す。
 *
 * @returns 生成処理の完了を表す Promise。
 */
const generateEarlyHints = async () => {
  const envResult = loadEnv({ mode: 'production', prefixes: ['PUBLIC_'] })
  const backendUrl = envResult.rawPublicVars.PUBLIC_BACKEND_URL
  envResult.cleanup()

  const [html, relativePaths, currentHeaders] = await Promise.all([
    readFile(INDEX_HTML_PATH, 'utf8'),
    readDistRelativePaths(),
    readFile(HEADERS_PATH, 'utf8'),
  ])
  const rules = createEarlyHintsHeaderRules({
    html,
    backendUrl,
    nonHtmlPaths: collectNonHtmlHeaderPaths(relativePaths),
  })
  const nextHeaders = `${currentHeaders.replace(/\n?$/, '\n')}\n${rules}`
  const ruleCount = countCloudflareHeaderRules(nextHeaders)
  if (ruleCount > CLOUDFLARE_PAGES_HEADER_RULE_LIMIT) {
    throw new Error(
      `_headers の規則数が ${CLOUDFLARE_PAGES_HEADER_RULE_LIMIT} を超えています: ${ruleCount}`
    )
  }

  await appendFile(HEADERS_PATH, `\n${rules}`, 'utf8')
}

await generateEarlyHints()

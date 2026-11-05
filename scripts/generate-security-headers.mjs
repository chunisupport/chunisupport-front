import { appendFile, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { loadEnv } from '@rsbuild/core'
import {
  collectInlineScriptHashes,
  createSecurityHeadersRule,
} from '../src/utils/securityHeaders.ts'

const DIST_DIRECTORY = path.resolve(import.meta.dirname, '../dist')
const HEADERS_PATH = path.join(DIST_DIRECTORY, '_headers')

/** CSP の生成に必須の公開環境変数。 */
const REQUIRED_ENV_KEYS = [
  'PUBLIC_BACKEND_URL',
  'PUBLIC_CHUNITHM_JACKET_BASE_URL',
  'PUBLIC_DOCUMENTATION_URL',
  'PUBLIC_FB_AUTH_DOMAIN',
]

/**
 * dist 配下のすべての HTML を読み込む。
 *
 * @returns HTML 本文の一覧。
 */
const readDistHtmlList = async () => {
  const entries = await readdir(DIST_DIRECTORY, { recursive: true })
  const htmlPaths = entries.filter((entry) => entry.endsWith('.html'))
  return Promise.all(htmlPaths.map((entry) => readFile(path.join(DIST_DIRECTORY, entry), 'utf8')))
}

/**
 * ビルド済み HTML と環境変数から全ページ共通のセキュリティヘッダーを生成し、
 * Cloudflare Pages の `dist/_headers` に追記する。
 *
 * 環境ごとに API・画像配信元などのオリジンが異なり、インライン script のハッシュも
 * ビルドごとに変わるため、静的な `public/_headers` ではなくビルド後に生成する。
 *
 * @returns 生成処理の完了を表す Promise。
 */
const generateSecurityHeaders = async () => {
  const envResult = loadEnv({ mode: 'production', prefixes: ['PUBLIC_'] })
  const env = envResult.rawPublicVars
  envResult.cleanup()

  const missingEnvKeys = REQUIRED_ENV_KEYS.filter((key) => !env[key])
  if (missingEnvKeys.length > 0) {
    throw new Error(`必須環境変数が設定されていません: ${missingEnvKeys.join(', ')}`)
  }

  const rule = createSecurityHeadersRule({
    backendUrl: env.PUBLIC_BACKEND_URL,
    jacketBaseUrl: env.PUBLIC_CHUNITHM_JACKET_BASE_URL,
    documentationUrl: env.PUBLIC_DOCUMENTATION_URL,
    staticDataBaseUrls: [env.PUBLIC_CHART_STATS_BASE_URL, env.PUBLIC_CHART_SCORES_BASE_URL],
    firebaseAuthDomain: env.PUBLIC_FB_AUTH_DOMAIN,
    inlineScriptHashes: collectInlineScriptHashes(await readDistHtmlList()),
  })

  await appendFile(
    HEADERS_PATH,
    `\n# 全ページ共通のセキュリティヘッダー（scripts/generate-security-headers.mjs で生成）。\n${rule}`,
    'utf8'
  )
}

await generateSecurityHeaders()

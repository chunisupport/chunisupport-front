import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { SELF_HOSTED_FONT_LICENSES } from '../src/assets/fonts/licenses/fontLicenses.ts'
import {
  collectGoogleFontFileUrls,
  createFontFileName,
  createFontStylesheetName,
  extractGoogleFontsStylesheetUrl,
  replaceGoogleFontsHtmlLinks,
  rewriteGoogleFontsStylesheet,
} from '../src/utils/selfHostedGoogleFonts.ts'

const DIST_DIRECTORY = path.resolve(import.meta.dirname, '../dist')
const INDEX_HTML_PATH = path.join(DIST_DIRECTORY, 'index.html')
const FONT_DIRECTORY = path.join(DIST_DIRECTORY, 'static/fonts')
const STYLESHEET_DIRECTORY = path.join(DIST_DIRECTORY, 'static/css')
const FONT_LICENSE_ROOT = path.resolve(import.meta.dirname, '../src/assets/fonts/licenses')

/**
 * woff2 だけを返すよう、最近の Chrome としてスタイルシートを要求する。
 *
 * User-Agent によって Google Fonts は別の形式やサブセットを返す。
 */
const GOOGLE_FONTS_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

/** フォントファイルを並行して取得する数。 */
const DOWNLOAD_CONCURRENCY = 8
/** 一時的な失敗を再試行する回数。 */
const FETCH_ATTEMPTS = 3
/** 1回の取得を打ち切るまでの時間（ミリ秒）。 */
const FETCH_TIMEOUT_MS = 30_000
/** 再試行前に待つ時間の基準（ミリ秒）。試行回数を掛ける。 */
const FETCH_RETRY_DELAY_MS = 500
/** woff2 ファイルの先頭シグネチャ。 */
const WOFF2_SIGNATURE = 'wOF2'

/**
 * 指定回数まで再試行してレスポンスを取得する。
 *
 * @param url - 取得する URL。
 * @param init - fetch の初期化子。
 * @returns 成功したレスポンス。
 */
const fetchOrThrow = async (url, init) => {
  let lastError = new Error('unknown')
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < FETCH_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, FETCH_RETRY_DELAY_MS * attempt))
      }
    }
  }
  throw new Error(`取得に失敗しました: ${url} (${lastError.message})`)
}

/**
 * 配列を上限つきの並行数で処理する。
 *
 * @param items - 処理する要素。
 * @param limit - 同時に進める件数。
 * @param worker - 各要素の処理。
 * @returns 入力と同じ順の結果。
 */
const mapPool = async (items, limit, worker) => {
  const results = new Array(items.length)
  let nextIndex = 0
  const run = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await worker(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
  return results
}

/**
 * リポジトリに同梱した OFL.txt を、woff2 と同じ `/static/fonts/` へコピーする。
 *
 * フォントファイルの取得や CSS の書き換えはしない。
 *
 * @returns コピーの完了を表す Promise。
 */
const copyFontLicenses = async () => {
  await Promise.all(
    SELF_HOSTED_FONT_LICENSES.map(async ({ id, copyright }) => {
      const license = await readFile(path.join(FONT_LICENSE_ROOT, id, 'OFL.txt'))
      const firstLine = license.toString('utf8').split('\n', 1)[0]
      if (firstLine !== copyright) {
        throw new Error(`フォントの著作権表示が一致しません: ${id}`)
      }
      if (!license.includes('SIL Open Font License, Version 1.1')) {
        throw new Error(`OFL 本文がありません: ${id}`)
      }
      const targetDirectory = path.join(FONT_DIRECTORY, id)
      await mkdir(targetDirectory, { recursive: true })
      await writeFile(path.join(targetDirectory, 'OFL.txt'), license)
    })
  )
}

/**
 * 圧縮後の大きさを添えて、バイト数をログへ出す。
 *
 * @param label - ログの見出し。
 * @param content - 計測する内容。
 */
const logSize = (label, content) => {
  const bytes = Buffer.from(content)
  console.log(
    `${label}: ${bytes.length} bytes (gzip ${gzipSync(bytes).length}, brotli ${brotliCompressSync(bytes).length})`
  )
}

/**
 * Rsbuild が残した Google Fonts の link を、ハッシュ付きの同一オリジン CSS へ置き換える。
 *
 * Cloudflare Fonts はエッジで HTML を書き換え、この link をインライン CSS にする。
 * リポジトリからはその書き換えを止められないため、link 自体をビルド成果物から除く。
 * フォントファイルは Google が配る woff2 を `/static/fonts/` へ置き、`/static/*` の
 * immutable 規則に載せる。環境ごとのホスト名は埋め込まない。
 *
 * @returns 生成処理の完了を表す Promise。
 */
const selfHostGoogleFonts = async () => {
  const html = await readFile(INDEX_HTML_PATH, 'utf8')
  const stylesheetUrl = extractGoogleFontsStylesheetUrl(html)
  const cssResponse = await fetchOrThrow(stylesheetUrl, {
    headers: {
      accept: 'text/css,*/*;q=0.1',
      'user-agent': GOOGLE_FONTS_USER_AGENT,
    },
  })
  if (new URL(cssResponse.url).origin !== 'https://fonts.googleapis.com') {
    throw new Error(`スタイルシートの最終 URL が Google Fonts ではありません: ${cssResponse.url}`)
  }
  const cssContentType = cssResponse.headers.get('content-type') ?? ''
  if (!cssContentType.includes('text/css')) {
    throw new Error(`スタイルシートの Content-Type が text/css ではありません: ${cssContentType}`)
  }

  const css = await cssResponse.text()
  const sourceUrls = collectGoogleFontFileUrls(css)
  const downloaded = await mapPool(sourceUrls, DOWNLOAD_CONCURRENCY, async (sourceUrl) => {
    const response = await fetchOrThrow(sourceUrl, {
      headers: { 'user-agent': GOOGLE_FONTS_USER_AGENT },
    })
    if (new URL(response.url).origin !== 'https://fonts.gstatic.com') {
      throw new Error(
        `フォントファイルの最終 URL が fonts.gstatic.com ではありません: ${response.url}`
      )
    }
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.subarray(0, WOFF2_SIGNATURE.length).toString('ascii') !== WOFF2_SIGNATURE) {
      throw new Error(`woff2 ではありません: ${sourceUrl}`)
    }
    const fileName = createFontFileName(bytes)
    return {
      sourceUrl,
      bytes,
      fileName,
      publicPath: `/static/fonts/${fileName}`,
    }
  })

  const bytesByFileName = new Map()
  const localPathBySourceUrl = new Map()
  for (const file of downloaded) {
    const existing = bytesByFileName.get(file.fileName)
    if (existing && !existing.equals(file.bytes)) {
      throw new Error(`フォントファイルのハッシュが衝突しました: ${file.fileName}`)
    }
    bytesByFileName.set(file.fileName, file.bytes)
    localPathBySourceUrl.set(file.sourceUrl, file.publicPath)
  }

  const rewrittenCss = rewriteGoogleFontsStylesheet(css, localPathBySourceUrl)
  const stylesheetName = createFontStylesheetName(rewrittenCss)
  const stylesheetHref = `/static/css/${stylesheetName}`
  const nextHtml = replaceGoogleFontsHtmlLinks(html, stylesheetHref)

  await mkdir(FONT_DIRECTORY, { recursive: true })
  await mkdir(STYLESHEET_DIRECTORY, { recursive: true })
  await Promise.all(
    [...bytesByFileName].map(([fileName, bytes]) =>
      writeFile(path.join(FONT_DIRECTORY, fileName), bytes)
    )
  )
  await writeFile(path.join(STYLESHEET_DIRECTORY, stylesheetName), rewrittenCss, 'utf8')
  await writeFile(INDEX_HTML_PATH, nextHtml, 'utf8')
  await copyFontLicenses()

  logSize('index.html before', html)
  logSize('index.html after', nextHtml)
  logSize(stylesheetHref, rewrittenCss)
  const fontBytes = [...bytesByFileName.values()].reduce((total, bytes) => total + bytes.length, 0)
  console.log(`woff2: ${bytesByFileName.size} files, ${fontBytes} bytes`)
}

await selfHostGoogleFonts()

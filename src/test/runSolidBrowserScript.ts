import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * ブラウザ向けSolidの実行条件で検証コードを別プロセスとして実行する。
 * Node.jsの既定条件ではSolidのサーバー向けビルドが読み込まれ、Signalの更新やResourceを検証できないため、
 * `--conditions=browser` を付けて起動する。
 *
 * @param script - ESモジュールとして実行する検証コード。importはリポジトリルートからの相対パスで書く。
 * @returns 検証が標準エラー出力なしで終了した時に解決するPromise。検証失敗時は拒否される。
 */
export const runSolidBrowserScript = async (script: string): Promise<void> => {
  const { stderr } = await execFileAsync(process.execPath, [
    '--conditions=browser',
    '--import',
    './scripts/register-ts-extension-loader.mjs',
    '--disable-warning=ExperimentalWarning',
    '--input-type=module',
    '--eval',
    script,
  ])
  assert.equal(stderr, '')
}

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { createRegisterScoreImageFiles } from './registerScoreImageFiles'

for (const { timezone, importedAt, expected } of [
  {
    timezone: 'UTC',
    importedAt: '2026-11-07T03:04:05Z',
    expected: 'chunisupport-score-update-20261107-030405.jpg',
  },
  {
    timezone: 'Asia/Tokyo',
    importedAt: '2026-11-07T03:04:05Z',
    expected: 'chunisupport-score-update-20261107-120405.jpg',
  },
  {
    timezone: 'UTC',
    importedAt: '2026-11-07T18:04:05Z',
    expected: 'chunisupport-score-update-20261107-180405.jpg',
  },
  {
    timezone: 'Asia/Tokyo',
    importedAt: '2026-11-07T18:04:05Z',
    expected: 'chunisupport-score-update-20261108-030405.jpg',
  },
]) {
  test(`更新日時${importedAt}を${timezone}のローカル日時へ変換してファイル名を作る`, () => {
    // Given: タイムゾーンを固定した子プロセスとAPIの更新日時
    const moduleUrl = new URL('./registerScoreImageFiles.ts', import.meta.url).href

    // When: 子プロセス内でローカル日時のファイル名を生成する
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        './scripts/register-ts-extension-loader.mjs',
        '--disable-warning=ExperimentalWarning',
        '--input-type=module',
        '--eval',
        `import { formatRegisterScoreImageFilename } from ${JSON.stringify(moduleUrl)}; process.stdout.write(formatRegisterScoreImageFilename(${JSON.stringify(importedAt)}))`,
      ],
      { env: { ...process.env, TZ: timezone }, encoding: 'utf8' }
    )

    // Then: ヘルパーに依存しない固定の日時・ファイル名になる
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout, expected)
    assert.match(result.stdout, /^chunisupport-score-update-\d{8}-\d{6}\.jpg$/)
  })
}

test('1枚の画像は従来のファイル名とJPEGの内容を維持する', async () => {
  // Given: 単一のJPEG画像。
  const blob = new Blob(['first'], { type: 'image/jpeg' })
  // When: 共有・保存用のファイルを作る。
  const files = createRegisterScoreImageFiles([blob], 'report.jpg')
  // Then: 元のファイル名と内容を維持する。
  assert.equal(files.length, 1)
  assert.equal(files[0].name, 'report.jpg')
  assert.equal(files[0].type, 'image/jpeg')
  assert.equal(await files[0].text(), 'first')
})

test('複数ページの画像は内容の順序を維持して連番を付ける', async () => {
  // Given: 3ページ分のJPEG画像。
  const blobs = ['first', 'second', 'third'].map((text) => new Blob([text]))
  // When: ファイル名へページ番号を付ける。
  const files = createRegisterScoreImageFiles(blobs, 'report.jpg')
  // Then: 各ページに別の名前が付き、内容も順序どおりである。
  assert.deepEqual(
    files.map((file) => file.name),
    ['report-1.jpg', 'report-2.jpg', 'report-3.jpg']
  )
  assert.deepEqual(await Promise.all(files.map((file) => file.text())), [
    'first',
    'second',
    'third',
  ])
  assert.ok(files.every((file) => file.type === 'image/jpeg'))
})

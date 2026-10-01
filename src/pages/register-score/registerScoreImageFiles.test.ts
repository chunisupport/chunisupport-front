import assert from 'node:assert/strict'
import test from 'node:test'
import { createRegisterScoreImageFiles } from './registerScoreImageFiles'

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

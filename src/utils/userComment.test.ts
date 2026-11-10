import assert from 'node:assert/strict'
import test from 'node:test'
import { countUserCommentLength, removeUserCommentLineBreaks } from './userComment'

test('改行と行区切り・段落区切りを取り除き、それ以外の文字は残すこと', () => {
  // Given: 改行、CRLF、Unicode の行区切り・段落区切りを含む入力。
  const value = 'よろ\nしく\r\nお願い\u2028し\u2029ます 🎵'

  // When: 改行を取り除く。
  const result = removeUserCommentLineBreaks(value)

  // Then: 改行類だけが消え、空白や絵文字は残る。
  assert.equal(result, 'よろしくお願いします 🎵')
})

test('前後の空白を除いたコードポイント数で数えること', () => {
  // Given: 前後に空白があり、サロゲートペアの絵文字を含む入力。
  const value = '  よろしく🎵  '

  // When: 文字数を数える。
  const result = countUserCommentLength(value)

  // Then: 空白を除き、絵文字を1文字として数える。
  assert.equal(result, 5)
})

test('空白のみの入力は0文字として数えること', () => {
  // Given: 空白のみの入力。
  const value = ' 　 '

  // When: 文字数を数える。
  const result = countUserCommentLength(value)

  // Then: 未設定扱いになる0文字を返す。
  assert.equal(result, 0)
})

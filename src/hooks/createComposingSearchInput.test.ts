import assert from 'node:assert/strict'
import test from 'node:test'
import { createRoot, createSignal } from 'solid-js'
import { createComposingSearchInput } from './createComposingSearchInput'

test('IME変換中は末尾の全角英字を検索値から外し、表示には残す', () => {
  createRoot((dispose) => {
    // Given: 空の検索欄
    const [stored, setStored] = createSignal('')
    const input = createComposingSearchInput({ value: stored, onChange: setStored })

    // When: 「かも」のあと、未確定の全角ｎを入力する
    input.beginComposition('かも')
    input.handleChange('かもｎ')

    // Then: 検索値は「かも」、入力欄の表示は未確定文字を含む
    assert.equal(stored(), 'かも')
    assert.equal(input.displayedValue(), 'かもｎ')

    // When: かなへ確定する
    input.endComposition('かもね')

    // Then: 確定文字列をそのまま検索値にする
    assert.equal(stored(), 'かもね')
    assert.equal(input.displayedValue(), 'かもね')
    dispose()
  })
})

test('確定した末尾の全角英字は検索値に残す', () => {
  createRoot((dispose) => {
    // Given: 空の検索欄
    const [stored, setStored] = createSignal('')
    const input = createComposingSearchInput({ value: stored, onChange: setStored })

    // When: 全角Ａを変換中に経て確定する
    input.beginComposition('')
    input.handleChange('Ａ')
    const composingValue = stored()
    input.endComposition('Ａ')

    // Then: 変換中は検索条件から外れ、確定後は残る
    assert.equal(composingValue, '')
    assert.equal(stored(), 'Ａ')
    assert.equal(input.displayedValue(), 'Ａ')
    dispose()
  })
})

test('変換中でない全角英字と、末尾以外の文字は検索値を変えない', () => {
  createRoot((dispose) => {
    // Given: 確定入力だけを受ける検索欄
    const [stored, setStored] = createSignal('')
    const input = createComposingSearchInput({ value: stored, onChange: setStored })

    // When: 変換せずに末尾の全角英字、全角数字、かなを入力する
    input.handleChange('TESTＡ')
    const fullwidthAlphabet = stored()
    input.handleChange('かも９')
    const fullwidthDigit = stored()
    input.handleChange('かもね')

    // Then: いずれも検索値から削除しない
    assert.equal(fullwidthAlphabet, 'TESTＡ')
    assert.equal(fullwidthDigit, 'かも９')
    assert.equal(stored(), 'かもね')
    assert.equal(input.displayedValue(), 'かもね')
    dispose()
  })
})

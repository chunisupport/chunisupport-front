import assert from 'node:assert/strict'
import test from 'node:test'
import { formatDelimitedText } from './delimitedText'

test('CSVでは各行をCRLFで区切り、nullを空セルとして書き出すこと', () => {
  // Given
  const rows = [
    ['id', 'value', 'flag'],
    ['a', 1, null],
    ['b', 14.5, true],
  ]

  // When
  const result = formatDelimitedText(rows, ',')

  // Then
  assert.equal(result, 'id,value,flag\r\na,1,\r\nb,14.5,true\r\n')
})

test('CSVではカンマ・二重引用符・改行を含むセルを二重引用符で囲むこと', () => {
  // Given
  const rows = [['A, B', 'say "hi"', 'line1\nline2', 'plain']]

  // When
  const result = formatDelimitedText(rows, ',')

  // Then
  assert.equal(result, '"A, B","say ""hi""","line1\nline2",plain\r\n')
})

test('TSVではタブを含むセルを囲み、カンマだけのセルは囲まないこと', () => {
  // Given
  const rows = [['A, B', 'C\tD']]

  // When
  const result = formatDelimitedText(rows, '\t')

  // Then
  assert.equal(result, 'A, B\t"C\tD"\r\n')
})

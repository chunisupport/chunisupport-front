import assert from 'node:assert/strict'
import test from 'node:test'
import { worldsendGridColumns } from './worldsendRecordTableLayout.ts'
import { worldsendTableWrapperClass } from './worldsendTableStyles.ts'

test("WORLD'S ENDテーブルのラッパーは横マージン込みでビューポートを超えない", () => {
  const classes = worldsendTableWrapperClass.split(/\s+/)

  assert.ok(classes.includes('mx-4'))
  assert.ok(classes.includes('w-auto'))
  assert.ok(classes.includes('max-w-[calc(100%-2rem)]'))
  assert.ok(!classes.includes('w-full'))
})

test("WORLD'S ENDの列幅は通常譜面と同等のコンパクトさを維持する", () => {
  assert.equal(worldsendGridColumns, 'minmax(15.75rem,1fr) 3.25rem 5.25rem 4.9rem 4.1rem')
})

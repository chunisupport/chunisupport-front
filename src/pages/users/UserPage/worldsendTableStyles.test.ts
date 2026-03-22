import test from 'node:test'
import assert from 'node:assert/strict'
import { worldsendTableWrapperClass } from './worldsendTableStyles.ts'

test("WORLD'S ENDテーブルのラッパーは横マージン込みでビューポートを超えない", () => {
  const classes = worldsendTableWrapperClass.split(/\s+/)

  assert.ok(classes.includes('mx-4'))
  assert.ok(classes.includes('w-auto'))
  assert.ok(classes.includes('max-w-[calc(100%-2rem)]'))
  assert.ok(!classes.includes('w-full'))
})

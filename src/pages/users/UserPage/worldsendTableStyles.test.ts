import assert from 'node:assert/strict'
import test from 'node:test'
import { worldsendGridColumns } from './worldsendRecordTableLayout.ts'
import { worldsendTableWrapperClass } from './worldsendTableStyles.ts'

test("WORLD'S ENDテーブルのラッパーは通常譜面と同じく横幅いっぱいに広がる", () => {
  const classes = worldsendTableWrapperClass.split(/\s+/)

  assert.ok(classes.includes('w-full'))
  assert.ok(!classes.includes('mx-4'))
  assert.ok(!classes.includes('w-auto'))
  assert.ok(!classes.includes('max-w-[calc(100%-2rem)]'))
})

test("WORLD'S ENDの列幅は通常譜面に近いバランスへ寄せる", () => {
  assert.equal(worldsendGridColumns, 'minmax(15.75rem,1fr) 3rem 50px 3.6rem 3.6rem 3.5rem')
})

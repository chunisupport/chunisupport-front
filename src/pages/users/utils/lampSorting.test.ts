import assert from 'node:assert/strict'
import test from 'node:test'
import { compareComboLamp, getComboLampKey } from './lampSorting.ts'

test('getComboLampKey は未プレイをUNPLAYEDとして返す', () => {
  assert.equal(getComboLampKey(false, null), 'UNPLAYED')
})

test('getComboLampKey はプレイ済みかつnullランプをNONEとして返す', () => {
  assert.equal(getComboLampKey(true, null), 'NONE')
})

test('compareComboLamp は NONE -> FC -> AJ -> UNPLAYED の順で比較する', () => {
  const noneVsFc = compareComboLamp(
    { is_played: true, combo_lamp: null },
    { is_played: true, combo_lamp: 'FULL COMBO' }
  )
  const fcVsAj = compareComboLamp(
    { is_played: true, combo_lamp: 'FULL COMBO' },
    { is_played: true, combo_lamp: 'ALL JUSTICE' }
  )
  const ajVsUnplayed = compareComboLamp(
    { is_played: true, combo_lamp: 'ALL JUSTICE' },
    { is_played: false, combo_lamp: null }
  )

  assert.equal(noneVsFc.skipDirection, false)
  assert.equal(fcVsAj.skipDirection, false)
  assert.equal(ajVsUnplayed.skipDirection, true)
  assert.equal(noneVsFc.comparison < 0, true)
  assert.equal(fcVsAj.comparison < 0, true)
  assert.equal(ajVsUnplayed.comparison, -1)
})

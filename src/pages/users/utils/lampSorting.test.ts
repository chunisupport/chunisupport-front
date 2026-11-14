import assert from 'node:assert/strict'
import test from 'node:test'
import {
  compareComboLamp,
  compareFullChainLamp,
  compareHardLamp,
  getComboLampKey,
  getFullChainLampKey,
  getHardLampKey,
} from './lampSorting'

test('getComboLampKey は未プレイをUNPLAYEDとして返す', () => {
  assert.equal(getComboLampKey(false, null), 'UNPLAYED')
})

test('getComboLampKey はプレイ済みかつnullランプをNONEとして返す', () => {
  assert.equal(getComboLampKey(true, null), 'NONE')
})

test('getComboLampKey はAJかつ理論値をALL JUSTICE CRITICALとして返す', () => {
  assert.equal(getComboLampKey(true, 'ALL JUSTICE', 1010000), 'ALL JUSTICE CRITICAL')
})

test('compareComboLamp は NONE -> FC -> AJ -> AJC -> UNPLAYED の順で比較する', () => {
  const noneVsFc = compareComboLamp(
    { is_played: true, combo_lamp: null },
    { is_played: true, combo_lamp: 'FULL COMBO' }
  )
  const fcVsAj = compareComboLamp(
    { is_played: true, combo_lamp: 'FULL COMBO' },
    { is_played: true, combo_lamp: 'ALL JUSTICE' }
  )
  const ajVsAjc = compareComboLamp(
    { is_played: true, combo_lamp: 'ALL JUSTICE', score: 1009999 },
    { is_played: true, combo_lamp: 'ALL JUSTICE', score: 1010000 }
  )
  const ajVsUnplayed = compareComboLamp(
    { is_played: true, combo_lamp: 'ALL JUSTICE' },
    { is_played: false, combo_lamp: null }
  )

  assert.equal(noneVsFc.skipDirection, false)
  assert.equal(fcVsAj.skipDirection, false)
  assert.equal(ajVsAjc.skipDirection, false)
  assert.equal(ajVsUnplayed.skipDirection, true)
  assert.equal(noneVsFc.comparison < 0, true)
  assert.equal(fcVsAj.comparison < 0, true)
  assert.equal(ajVsAjc.comparison < 0, true)
  assert.equal(ajVsUnplayed.comparison, -1)
})

test('getComboLampKey はプレイ済みかつ未知のランプをNONEとして返す', () => {
  // Given: プレイ済みかつ一覧にないランプ値
  const comboLamp = 'INVALID'
  // When: ソート用キーを取得する
  const result = getComboLampKey(true, comboLamp)
  // Then: NONEに正規化される
  assert.equal(result, 'NONE')
})

test('getComboLampKey はプレイ済みかつUNPLAYEDをUNPLAYEDとして返す', () => {
  // Given: プレイ済みかつUNPLAYED
  const comboLamp = 'UNPLAYED'
  // When: ソート用キーを取得する
  const result = getComboLampKey(true, comboLamp)
  // Then: UNPLAYEDのまま返される
  assert.equal(result, 'UNPLAYED')
})

test('getHardLampKey はプレイ済みかつCLEARをCLEARとして返す', () => {
  // Given: プレイ済みかつCLEAR
  const clearLamp = 'CLEAR'
  // When: ソート用キーを取得する
  const result = getHardLampKey(true, clearLamp)
  // Then: CLEARのまま返される
  assert.equal(result, 'CLEAR')
})

test('compareHardLamp は片方のみ未所持の場合に未所持側を後ろにする', () => {
  // Given: 所持側と未所持側の記録
  const played = { is_played: true, clear_lamp: 'CLEAR' }
  const missing = { is_played: true, clear_lamp: 'NONE' }
  // When: 両方向で比較する
  const playedVsMissing = compareHardLamp(played, missing)
  const missingVsPlayed = compareHardLamp(missing, played)
  // Then: 未所持側が後ろになる
  assert.equal(playedVsMissing.comparison, -1)
  assert.equal(playedVsMissing.skipDirection, true)
  assert.equal(missingVsPlayed.comparison, 1)
  assert.equal(missingVsPlayed.skipDirection, true)
})

test('getFullChainLampKey はプレイ済みかつGOLDをGOLDとして返す', () => {
  // Given: プレイ済みかつFULL CHAIN GOLD
  const fullChain = 'FULL CHAIN GOLD'
  // When: ソート用キーを取得する
  const result = getFullChainLampKey(true, fullChain)
  // Then: GOLDのまま返される
  assert.equal(result, 'FULL CHAIN GOLD')
})

test('getFullChainLampKey はプレイ済みかつPLATINUMをPLATINUMとして返す', () => {
  // Given: プレイ済みかつFULL CHAIN PLATINUM
  const fullChain = 'FULL CHAIN PLATINUM'
  // When: ソート用キーを取得する
  const result = getFullChainLampKey(true, fullChain)
  // Then: PLATINUMのまま返される
  assert.equal(result, 'FULL CHAIN PLATINUM')
})

test('compareFullChainLamp は片方のみ未プレイの場合に未プレイ側を後ろにする', () => {
  // Given: プレイ済みと未プレイの記録
  const played = { is_played: true, full_chain: 'FULL CHAIN GOLD' }
  const missing = { is_played: false, full_chain: null }
  // When: 両方向で比較する
  const playedVsMissing = compareFullChainLamp(played, missing)
  const missingVsPlayed = compareFullChainLamp(missing, played)
  // Then: 未プレイ側が後ろになる
  assert.equal(playedVsMissing.comparison, -1)
  assert.equal(playedVsMissing.skipDirection, true)
  assert.equal(missingVsPlayed.comparison, 1)
  assert.equal(missingVsPlayed.skipDirection, true)
})

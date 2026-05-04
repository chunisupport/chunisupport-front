import assert from 'node:assert/strict'
import test from 'node:test'
import { getSongDetailViewState } from './songDetailLayoutModel.ts'

test('共通レイアウト状態判定: loading中はsongがあってもloadingを優先', () => {
  assert.equal(getSongDetailViewState(true, true), 'loading')
})

test('共通レイアウト状態判定: songがあり非loadingならcontent', () => {
  assert.equal(getSongDetailViewState(true, false), 'content')
})

test('共通レイアウト状態判定: songなし+loadingでloading', () => {
  assert.equal(getSongDetailViewState(false, true), 'loading')
})

test('共通レイアウト状態判定: songなし+非loadingでerror', () => {
  assert.equal(getSongDetailViewState(false, false), 'error')
})

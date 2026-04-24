import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildLoginRedirectPath,
  resolvePostLoginRedirectPath,
  sanitizeRedirectPath,
} from './redirectPath.ts'

test('sanitizeRedirectPath: 通常の相対パスは許可する', () => {
  const result = sanitizeRedirectPath('/users/user001?page=score#best')
  assert.equal(result, '/users/user001?page=score#best')
})

test('sanitizeRedirectPath: 外部URLは拒否する', () => {
  const result = sanitizeRedirectPath('https://evil.example/path')
  assert.equal(result, null)
})

test('sanitizeRedirectPath: スキーム相対URLは拒否する', () => {
  const result = sanitizeRedirectPath('//evil.example/path')
  assert.equal(result, null)
})

test('sanitizeRedirectPath: 3つ以上のスラッシュで始まるパスは拒否する', () => {
  const result = sanitizeRedirectPath('///evil.example/path')
  assert.equal(result, null)
})

test('sanitizeRedirectPath: バックスラッシュを含むパスは拒否する', () => {
  const result = sanitizeRedirectPath('/\\evil')
  assert.equal(result, null)
})

test('buildLoginRedirectPath: 現在ページが安全なら redirect クエリを付与する', () => {
  const result = buildLoginRedirectPath('/users/user001')
  assert.equal(result, '/login?redirect=%2Fusers%2Fuser001')
})

test('buildLoginRedirectPath: ログイン画面自身なら redirect を付与しない', () => {
  const result = buildLoginRedirectPath('/login?foo=bar')
  assert.equal(result, '/login')
})

test('buildLoginRedirectPath: ログイン画面ハッシュ付きでも redirect を付与しない', () => {
  const result = buildLoginRedirectPath('/login#top')
  assert.equal(result, '/login')
})

test('resolvePostLoginRedirectPath: 安全な redirect パラメータを返す', () => {
  const result = resolvePostLoginRedirectPath('/settings/privacy')
  assert.equal(result, '/settings/privacy')
})

test('resolvePostLoginRedirectPath: /login への戻りは拒否する', () => {
  const result = resolvePostLoginRedirectPath('/login?redirect=%2Fgoals')
  assert.equal(result, null)
})

test('resolvePostLoginRedirectPath: /register への戻りは拒否する', () => {
  const result = resolvePostLoginRedirectPath('/register?foo=bar')
  assert.equal(result, null)
})

test('resolvePostLoginRedirectPath: /login#... への戻りは拒否する', () => {
  const result = resolvePostLoginRedirectPath('/login#top')
  assert.equal(result, null)
})

test('resolvePostLoginRedirectPath: /register#... への戻りは拒否する', () => {
  const result = resolvePostLoginRedirectPath('/register#step2')
  assert.equal(result, null)
})

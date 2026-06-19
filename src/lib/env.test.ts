import assert from 'node:assert/strict'
import test from 'node:test'

import { getEnv, getRequiredEnv } from './env.ts'

test('getEnv は process.env の値を取得できる', () => {
  const original = process.env.PUBLIC_BACKEND_URL
  process.env.PUBLIC_BACKEND_URL = 'http://localhost:3000'

  try {
    const env = getEnv()
    assert.equal(env.PUBLIC_BACKEND_URL, 'http://localhost:3000')
  } finally {
    if (original === undefined) {
      delete process.env.PUBLIC_BACKEND_URL
    } else {
      process.env.PUBLIC_BACKEND_URL = original
    }
  }
})

test('getRequiredEnv は値がなければ例外を投げる', () => {
  const original = process.env.PUBLIC_FB_API_KEY
  delete process.env.PUBLIC_FB_API_KEY

  try {
    assert.throws(() => getRequiredEnv('PUBLIC_FB_API_KEY'))
  } finally {
    if (original === undefined) {
      delete process.env.PUBLIC_FB_API_KEY
    } else {
      process.env.PUBLIC_FB_API_KEY = original
    }
  }
})

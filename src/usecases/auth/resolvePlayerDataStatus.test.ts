import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerDTO } from '../../types/api'
import { resolvePlayerDataStatus } from './resolvePlayerDataStatus.ts'

const player = { name: 'PLAYER' } as PlayerDTO

test('未ログインの場合はプロフィールを取得せず未ログイン状態を返すこと', async () => {
  // Given: 認証セッションが未ログインに解決される
  let profileCalls = 0

  // When: プレイヤーデータ状態を解決する
  const result = await resolvePlayerDataStatus({
    resolveAuth: async () => 'unauthenticated',
    getUsername: () => null,
    fetchProfile: async (username) => {
      profileCalls += 1
      return { username, player }
    },
  })

  // Then: 未ログイン状態となりプロフィールは取得されない
  assert.equal(result, 'unauthenticated')
  assert.equal(profileCalls, 0)
})

test('プレイヤー未連携の場合は未登録状態を返すこと', async () => {
  // Given: ログイン済みでプロフィールのプレイヤーが null
  // When: プレイヤーデータ状態を解決する
  const result = await resolvePlayerDataStatus({
    resolveAuth: async () => 'authenticated',
    getUsername: () => 'alice',
    fetchProfile: async (username) => ({ username, player: null }),
  })

  // Then: 未登録状態となる
  assert.equal(result, 'unregistered')
})

test('プレイヤー連携済みの場合は本人のプロフィールから登録済み状態を返すこと', async () => {
  // Given: ログイン済みでプロフィールにプレイヤーが存在する
  const requestedUsers: string[] = []

  // When: プレイヤーデータ状態を解決する
  const result = await resolvePlayerDataStatus({
    resolveAuth: async () => 'authenticated',
    getUsername: () => 'alice',
    fetchProfile: async (username) => {
      requestedUsers.push(username)
      return { username, player }
    },
  })

  // Then: 本人のプロフィールを参照して登録済み状態となる
  assert.equal(result, 'registered')
  assert.deepEqual(requestedUsers, ['alice'])
})

test('認証情報の取得に失敗した場合はエラーをスローすること', async () => {
  // Given: 認証に失敗するが、ユーザー名は残っている。
  let profileCalls = 0

  // When / Then: 認証失敗のエラーを返し、プロフィール取得には進まない。
  await assert.rejects(
    resolvePlayerDataStatus({
      resolveAuth: async () => 'error',
      getUsername: () => 'alice',
      fetchProfile: async (username) => {
        profileCalls += 1
        return { username, player }
      },
    }),
    new Error('認証情報の取得に失敗しました。ページを再読み込みしてください。')
  )
  assert.equal(profileCalls, 0)
})

test('認証済みでもユーザー名を取得できない場合はエラーをスローすること', async () => {
  // Given: 認証は成功したが、ユーザー名が取得できない。
  let profileCalls = 0

  // When / Then: 認証失敗と同じエラーを返し、プロフィール取得には進まない。
  await assert.rejects(
    resolvePlayerDataStatus({
      resolveAuth: async () => 'authenticated',
      getUsername: () => null,
      fetchProfile: async (username) => {
        profileCalls += 1
        return { username, player }
      },
    }),
    new Error('認証情報の取得に失敗しました。ページを再読み込みしてください。')
  )
  assert.equal(profileCalls, 0)
})

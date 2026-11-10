import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerDTO, UserRatingDTO } from '../../types/api'
import { fetchLandingProfile } from './fetchLandingProfile.ts'

const player: PlayerDTO = {
  name: 'PLAYER',
  level: 25,
  rating: 0,
  class_emblem: 'inf',
  class_emblem_base: '3',
  possession_id: 1,
  last_played_at: null,
  overpower_value: 0,
  overpower_percent: 0,
  official_overpower: 0,
  official_overpower_percent: null,
  team_name: null,
  team_color: null,
  honors: [],
  created_at: '',
  updated_at: '',
}
const rating: UserRatingDTO = {
  rating: 0,
  best_average: null,
  new_average: null,
  best: [],
  best_candidate: [],
  new: [],
  new_candidate: [],
  meta: { updated_at: null },
}

test('未登録の場合はレーティングを取得せず未登録状態を返す', async () => {
  let ratingCalls = 0
  const result = await fetchLandingProfile('alice', {
    fetchProfile: async (username) => ({ username, player: null }),
    fetchRating: async () => {
      ratingCalls += 1
      return rating
    },
  })
  assert.deepEqual(result, { type: 'empty' })
  assert.equal(ratingCalls, 0)
})

test('数値が0の登録済みプレイヤーを未登録と扱わず名札用データを返す', async () => {
  const requestedUsers: string[] = []
  const result = await fetchLandingProfile('alice', {
    fetchProfile: async (username) => {
      requestedUsers.push(username)
      return { username, player }
    },
    fetchRating: async (username) => {
      requestedUsers.push(username)
      return rating
    },
  })
  assert.deepEqual(result, { type: 'loaded', player, rating })
  assert.deepEqual(requestedUsers, ['alice', 'alice'])
})

test('プロフィール取得失敗を未登録と扱わず、レーティングも取得しない', async () => {
  let ratingCalls = 0
  const result = await fetchLandingProfile('alice', {
    fetchProfile: async () => {
      throw new Error('network')
    },
    fetchRating: async () => {
      ratingCalls += 1
      return rating
    },
  })
  assert.deepEqual(result, { type: 'error' })
  assert.equal(ratingCalls, 0)
})

test('レーティング取得失敗後も再試行で名札用データを取得できる', async () => {
  let ratingCalls = 0
  const dependencies = {
    fetchProfile: async (username: string) => ({ username, player }),
    fetchRating: async () => {
      ratingCalls += 1
      if (ratingCalls === 1) throw new Error('network')
      return rating
    },
  }
  assert.deepEqual(await fetchLandingProfile('alice', dependencies), { type: 'error' })
  assert.deepEqual(await fetchLandingProfile('alice', dependencies), {
    type: 'loaded',
    player,
    rating,
  })
})

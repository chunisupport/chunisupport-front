import assert from 'node:assert/strict'
import test from 'node:test'
import type { GoalDTO } from '../../../types/api'
import { GOAL_COPY_TITLE_SUFFIX, GOAL_TITLE_MAX_LENGTH } from './constants'
import { buildCopiedGoalTitle, buildGoalCopyRequest } from './goalCopy'

/**
 * 複製リクエストのテストに使う目標を作る。
 *
 * @param overrides - テストごとに差し替える目標項目。
 * @returns 複製元として使う目標。
 */
const createGoal = (overrides: Partial<GoalDTO> = {}): GoalDTO => ({
  id: 10,
  group_id: 3,
  title: 'SSS+を10譜面',
  achievement_type: 'score_count',
  achievement_params: { score: 1_009_000, count: 10 },
  attributes: { diff: [3], const: { min: 14, max: 15 } },
  invert: false,
  sort_order: 2,
  created_at: '2026-08-04T00:00:00Z',
  ...overrides,
})

test('短いタイトルにはコピー表記を追加する', () => {
  // Given: 上限に余裕があるタイトル。
  const title = 'SSS+を10譜面'

  // When: 複製後のタイトルを作る。
  const result = buildCopiedGoalTitle(title)

  // Then: 元のタイトルを維持してコピー表記が付く。
  assert.equal(result, `${title}${GOAL_COPY_TITLE_SUFFIX}`)
})

test('長いタイトルは末尾を削ってコピー表記を含む上限内に収める', () => {
  // Given: タイトル上限いっぱいの文字列。
  const title = '目'.repeat(GOAL_TITLE_MAX_LENGTH)

  // When: 複製後のタイトルを作る。
  const result = buildCopiedGoalTitle(title)

  // Then: 上限を超えず、コピー表記で終わる。
  assert.equal(Array.from(result).length, GOAL_TITLE_MAX_LENGTH)
  assert.equal(result.endsWith(GOAL_COPY_TITLE_SUFFIX), true)
})

test('絵文字をUnicodeコードポイント単位で数えて必要な末尾だけを削る', () => {
  // Given: コピー表記を加えると上限を1文字超える絵文字タイトル。
  const baseMaxLength = GOAL_TITLE_MAX_LENGTH - Array.from(GOAL_COPY_TITLE_SUFFIX).length
  const title = '🎯'.repeat(baseMaxLength + 1)

  // When: 複製後のタイトルを作る。
  const result = buildCopiedGoalTitle(title)

  // Then: 絵文字を1文字として数え、上限に収まる数を維持する。
  assert.equal(result, `${'🎯'.repeat(baseMaxLength)}${GOAL_COPY_TITLE_SUFFIX}`)
  assert.equal(Array.from(result).length, GOAL_TITLE_MAX_LENGTH)
})

test('複製リクエストは同じグループと目標条件を引き継ぐ', () => {
  // Given: グループに所属する保存済み目標。
  const goal = createGoal()

  // When: 複製用リクエストを作る。
  const result = buildGoalCopyRequest(goal)

  // Then: 保存専用項目を除き、タイトル以外の設定を引き継ぐ。
  assert.deepEqual(result, {
    group_id: goal.group_id,
    title: `${goal.title}${GOAL_COPY_TITLE_SUFFIX}`,
    achievement_type: goal.achievement_type,
    achievement_params: goal.achievement_params,
    attributes: goal.attributes,
    invert: goal.invert,
  })
})

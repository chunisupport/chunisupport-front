import assert from 'node:assert/strict'
import test from 'node:test'
import type { GoalDTO, PlayerRecordDTO, SongDTO } from '../types/api'
import { isComboLampGoalValue, isHardLampGoalValue, resolveHardLampRecordName } from './goalLamp'
import { filterRandomSongCandidatesByGoal } from './randomSongGoalFilter'
import { createRandomSongRecordMap, type RandomSongCandidate } from './randomSongSelector'

test('ハードランプ目標値はレコード上のランプ名へ変換される', () => {
  // Given
  const goalLamp = 'ABS'

  // When
  const result = resolveHardLampRecordName(goalLamp)

  // Then
  assert.equal(result, 'ABSOLUTE')
})

test('ランプ目標値の型ガードは定義済みの値だけを許可する', () => {
  // Given / When / Then
  assert.equal(isHardLampGoalValue('CTS'), true)
  assert.equal(isHardLampGoalValue('CLEAR'), false)
  assert.equal(isComboLampGoalValue('AJ'), true)
  assert.equal(isComboLampGoalValue('FULL COMBO'), false)
})

test('ランプ目標の未達成フィルターは達成境界で選曲候補を分けること', async (t) => {
  // Given: ランプ以外の条件はすべて共通の選曲候補とレコード。
  const song: SongDTO = {
    id: 'lamp-song',
    title: 'ランプ判定曲',
    reading: null,
    name_folder_code: 'NUMBER',
    artist: 'アーティスト',
    genre: 'ORIGINAL',
    bpm: 180,
    release: '2025-01-01',
    official_idx: '1',
    jacket: null,
    maxop: 0,
    is_maxop_unknown: false,
    op_target_difficulty: 'MASTER',
    is_new: false,
    unlock_required: false,
    charts: { MASTER: { const: 14, is_const_unknown: false, notes: 1000 } },
  }
  const candidate: RandomSongCandidate = {
    song,
    difficulty: 'MASTER',
    chartConst: 14,
    levelLabel: '14',
    genre: 'ORIGINAL',
    version: 'VERSE',
  }
  const record: PlayerRecordDTO = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    difficulty: 'MASTER',
    const: 14,
    is_const_unknown: false,
    is_played: true,
    is_op_target: false,
    updated_at: null,
    score: 1_000_000,
    rating: 15,
    overpower: 0,
    overpower_percent: 0,
    justice_count: null,
    img: '',
    clear_lamp: null,
    combo_lamp: null,
    full_chain: null,
    slot: null,
  }
  const baseGoal = {
    id: 1,
    group_id: null,
    title: 'ランプ目標',
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  }

  for (const { name, achievementType, lamp, lamps, expected } of [
    {
      name: 'ABS目標の直前のBRAVEは対象になる',
      achievementType: 'hardlamp_count',
      lamp: 'ABS',
      lamps: { clear_lamp: 'BRAVE' },
      expected: true,
    },
    {
      name: 'ABS目標ちょうどのABSOLUTEは対象外になる',
      achievementType: 'hardlamp_count',
      lamp: 'ABS',
      lamps: { clear_lamp: 'ABSOLUTE' },
      expected: false,
    },
    {
      name: 'ABS目標より上位のCATASTROPHYは対象外になる',
      achievementType: 'hardlamp_count',
      lamp: 'ABS',
      lamps: { clear_lamp: 'CATASTROPHY' },
      expected: false,
    },
    {
      name: 'ABS目標でランプがnullなら対象になる',
      achievementType: 'hardlamp_count',
      lamp: 'ABS',
      lamps: { clear_lamp: null },
      expected: true,
    },
    {
      name: 'AJ目標の直前のFULL COMBOは対象になる',
      achievementType: 'combolamp_count',
      lamp: 'AJ',
      lamps: { combo_lamp: 'FULL COMBO' },
      expected: true,
    },
    {
      name: 'AJ目標ちょうどのALL JUSTICEは対象外になる',
      achievementType: 'combolamp_count',
      lamp: 'AJ',
      lamps: { combo_lamp: 'ALL JUSTICE' },
      expected: false,
    },
    {
      name: 'AJ目標でランプがnullなら対象になる',
      achievementType: 'combolamp_count',
      lamp: 'AJ',
      lamps: { combo_lamp: null },
      expected: true,
    },
  ] as const) {
    await t.test(name, () => {
      // Given: 達成境界のランプを持つレコードと目標。
      const records = createRandomSongRecordMap([{ ...record, ...lamps }])
      const goal: GoalDTO = {
        ...baseGoal,
        achievement_type: achievementType,
        achievement_params: { lamp, count: 1 },
      }

      // When: 未達成の選曲候補を絞り込む。
      const result = filterRandomSongCandidatesByGoal(
        [candidate],
        records,
        goal,
        { difficulties: [], genres: [] },
        []
      )

      // Then: 直前とnullは残り、目標ちょうどと上位は除外される。
      assert.deepEqual(result, expected ? [candidate] : [])
    })
  }
})

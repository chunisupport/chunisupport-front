import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO, WorldsendRecordDTO } from '../types/api.ts'
import {
  buildCourseTrackBestRecords,
  courseChartKey,
  formatCourseTrackFilter,
  formatCourseWorldsendChart,
  getCourseTrackSongPath,
} from './courseTracks.ts'

test('courseChartKeyは曲IDと難易度から一意なキーを生成すること', () => {
  // Given
  const chart = { id: 'song-123', difficulty: 'MASTER' as const }

  // When
  const result = courseChartKey(chart)

  // Then
  assert.equal(result, 'song-123:MASTER')
})

test('formatCourseTrackFilterはレベル範囲とジャンルを簡潔な文字列に整形すること', () => {
  // Given & When & Then
  assert.equal(
    formatCourseTrackFilter({
      min_level: '14',
      max_level: '14+',
      genres: ['ゲキマイ', 'ORIGINAL'],
    }),
    'Lv.14〜14+ / ゲキマイ・ORIGINAL'
  )
  assert.equal(formatCourseTrackFilter({ min_level: '14+', max_level: '14+' }), 'Lv.14+')
  assert.equal(formatCourseTrackFilter({ min_level: '13+' }), 'Lv.13+以上')
  assert.equal(formatCourseTrackFilter({ max_level: '12' }), 'Lv.12以下')
  assert.equal(formatCourseTrackFilter({ genres: ['東方Project'] }), '東方Project')
  assert.equal(formatCourseTrackFilter({}), '')
})

test('同名のWORLD’S END譜面に別々の自己ベスト・ランプと詳細リンクを対応させる', () => {
  // Given
  const first = {
    id: 'a',
    title: 'Random',
    score: 1005000,
    is_played: true,
    clear_lamp: 'CLEAR',
    combo_lamp: 'FULL COMBO',
    full_chain: null,
  } as WorldsendRecordDTO
  const second = {
    id: 'b',
    title: 'Random',
    score: 1006000,
    is_played: true,
    clear_lamp: 'HARD',
    combo_lamp: 'ALL JUSTICE',
    full_chain: 'FULL CHAIN GOLD',
  } as WorldsendRecordDTO
  const standardPlayed = {
    id: 'p',
    difficulty: 'ULTIMA',
    score: 1009500,
    is_played: true,
    clear_lamp: 'BRAVE',
    combo_lamp: 'ALL JUSTICE',
    full_chain: null,
  } as PlayerRecordDTO
  const standardUnplayed = {
    id: 's',
    difficulty: 'MASTER',
    score: 0,
    is_played: false,
  } as PlayerRecordDTO

  // When
  const bestRecords = buildCourseTrackBestRecords({
    standard: [standardPlayed, standardUnplayed],
    worldsend: [first, second],
    meta: { updated_at: null },
  })

  // Then
  assert.deepEqual(bestRecords.get('p:ULTIMA'), {
    score: 1009500,
    clear_lamp: 'BRAVE',
    combo_lamp: 'ALL JUSTICE',
    full_chain: null,
  })
  assert.deepEqual(bestRecords.get('a:WORLDSEND'), {
    score: 1005000,
    clear_lamp: 'CLEAR',
    combo_lamp: 'FULL COMBO',
    full_chain: null,
  })
  assert.deepEqual(bestRecords.get('b:WORLDSEND'), {
    score: 1006000,
    clear_lamp: 'HARD',
    combo_lamp: 'ALL JUSTICE',
    full_chain: 'FULL CHAIN GOLD',
  })
  assert.equal(bestRecords.has('s:MASTER'), false)
  assert.equal(
    getCourseTrackSongPath({ id: second.id, difficulty: 'WORLDSEND' }),
    '/songs/worldsend/b'
  )
  assert.equal(
    formatCourseWorldsendChart({ attribute: '分', level_star: 3, notes: 1520 }),
    '分★3 / 1,520 NOTES'
  )
})

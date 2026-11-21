import assert from 'node:assert/strict'
import test from 'node:test'
import type { CourseChartRefDTO, CourseTrackDTO } from '../../types/api.ts'
import {
  addCourseTrackChart,
  createCourseTrackDrafts,
  toCourseTrackRequest,
  validateCourseTrackDraft,
} from './courseTrackEditor.ts'

test('構成をトラック番号順に展開し、選曲方式に必要な項目だけを送る', () => {
  // Given
  const filtered: CourseTrackDTO = {
    track_no: 2,
    selection_type: 'RANDOM_FILTER',
    filter: { max_level: '14+', genres: ['ゲキマイ', '東方Project'] },
  }
  const [fixed, filter, pool] = createCourseTrackDrafts([filtered])
  const chart: CourseChartRefDTO = { id: 'course-song', difficulty: 'MASTER' }

  // When
  filter.charts.push(chart)
  const result = [fixed, filter, pool].map(toCourseTrackRequest)

  // Then
  assert.deepEqual(
    result.map((track) => track.track_no),
    [1, 2, 3]
  )
  assert.deepEqual(JSON.parse(JSON.stringify(result[1])), filtered)
  assert.deepEqual(result[0], { track_no: 1, selection_type: 'FIXED', charts: [] })
})

test('未設定の枠、空のフィルターと逆順の範囲を拒否する', () => {
  // Given
  const [draft] = createCourseTrackDrafts([])

  // When & Then
  assert.ok(validateCourseTrackDraft(draft))
  assert.ok(validateCourseTrackDraft({ ...draft, selectionType: 'RANDOM_POOL' }))
  assert.ok(validateCourseTrackDraft({ ...draft, selectionType: 'RANDOM_FILTER' }))
  assert.ok(
    validateCourseTrackDraft({
      ...draft,
      selectionType: 'RANDOM_FILTER',
      minLevel: '15',
      maxLevel: '14+',
    })
  )
  assert.equal(
    validateCourseTrackDraft({
      ...draft,
      selectionType: 'RANDOM_FILTER',
      minLevel: '14+',
      maxLevel: '14+',
    }),
    undefined
  )
})

test('固定枠は選択を置き換え、指定プールは曲と難易度の組で重複を防ぐ', () => {
  // Given
  const [draft] = createCourseTrackDrafts([])
  const master: CourseChartRefDTO = { id: 'song-a', difficulty: 'MASTER' }
  const ultima: CourseChartRefDTO = { id: 'song-a', difficulty: 'ULTIMA' }
  const fixed = { ...draft, charts: [master] }
  const pool = { ...fixed, selectionType: 'RANDOM_POOL' as const }

  // When & Then
  assert.deepEqual(addCourseTrackChart(fixed, ultima), [ultima])
  assert.deepEqual(addCourseTrackChart(pool, ultima), [master, ultima])
  assert.deepEqual(addCourseTrackChart(pool, master), [master])
})

test('同名のWORLD’S END譜面を公開IDで区別し、6譜面を同じ指定プールに保存する', () => {
  // Given
  const [draft] = createCourseTrackDrafts([])
  const pool = { ...draft, selectionType: 'RANDOM_POOL' as const }
  const charts = Array.from(
    { length: 6 },
    (_, index): CourseChartRefDTO => ({
      id: String(index + 1).padStart(16, '0'),
      difficulty: 'WORLDSEND',
    })
  )

  // When
  for (const chart of charts) pool.charts = addCourseTrackChart(pool, chart)
  pool.charts = addCourseTrackChart(pool, charts[0])

  // Then
  assert.equal(validateCourseTrackDraft(pool), undefined)
  assert.deepEqual(toCourseTrackRequest(pool), {
    track_no: 1,
    selection_type: 'RANDOM_POOL',
    charts,
  })
})

import assert from 'node:assert/strict'
import test from 'node:test'
import type { CourseDetailDTO, CourseTrackCandidateDTO } from '../types/api'
import {
  type CourseCandidateFilter,
  filterAndSortCourseCandidates,
  listCourseCandidateDifficulties,
  pickRandomCourseCandidate,
  resolveCoursePicks,
} from './courseTrackCandidates'
import type { CourseTrackBestRecord } from './courseTracks'

const chart = (
  id: string,
  title: string,
  difficulty: 'EXPERT' | 'MASTER',
  constant: number
): CourseTrackCandidateDTO => ({
  id,
  title,
  jacket: null,
  difficulty,
  const: constant,
  is_const_unknown: false,
})

const worldsend: CourseTrackCandidateDTO = {
  id: 'we',
  title: 'ワールズエンド',
  jacket: null,
  difficulty: 'WORLDSEND',
  attribute: '狂',
  level_star: 5,
  notes: null,
}

const candidates = [
  chart('a', 'Bravo', 'MASTER', 14.5),
  chart('b', 'alpha', 'EXPERT', 12.8),
  worldsend,
  chart('c', 'Charlie', 'MASTER', 13.2),
]

const record = (score: number): CourseTrackBestRecord => ({
  score,
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
})

const records = new Map([
  ['a:MASTER', record(1_009_000)],
  ['b:EXPERT', record(1_005_000)],
])

const allFilter: CourseCandidateFilter = {
  query: '',
  difficulties: ['EXPERT', 'MASTER', 'WORLDSEND'],
  scoreMin: '',
  scoreMax: '',
}

const ids = (charts: readonly CourseTrackCandidateDTO[]) => charts.map((item) => item.id)

test('候補に含まれる難易度を正規順で重複なく返すこと', () => {
  // When: 難易度一覧を作る。
  const result = listCourseCandidateDifficulties(candidates)

  // Then: EXPERT、MASTER、WORLD'S ENDの順になる。
  assert.deepEqual(result, ['EXPERT', 'MASTER', 'WORLDSEND'])
})

test('標準の並びでは条件を満たす候補をAPIの返却順のまま返すこと', () => {
  // When: 絞り込みなし・標準順で処理する。
  const result = filterAndSortCourseCandidates(candidates, records, allFilter, {
    key: 'default',
    direction: 'asc',
  })

  // Then: 元の順序を保つ。
  assert.deepEqual(ids(result), ['a', 'b', 'we', 'c'])
})

test('検索語・難易度・スコア範囲で絞り込み、未プレイはスコア0として扱うこと', () => {
  // Given: 曲名の大文字小文字を無視した検索と、MASTERのみ・スコア上限の条件。
  const sort = { key: 'default', direction: 'asc' } as const

  // When: 各条件で絞り込む。
  const byQuery = filterAndSortCourseCandidates(
    candidates,
    records,
    { ...allFilter, query: 'ALP' },
    sort
  )
  const byDifficulty = filterAndSortCourseCandidates(
    candidates,
    records,
    { ...allFilter, difficulties: ['MASTER'] },
    sort
  )
  const byScoreMax = filterAndSortCourseCandidates(
    candidates,
    records,
    { ...allFilter, scoreMax: '1005000' },
    sort
  )
  const byScoreMin = filterAndSortCourseCandidates(
    candidates,
    records,
    { ...allFilter, scoreMin: '1' },
    sort
  )

  // Then: 未プレイは上限条件に残り、下限条件では外れる。
  assert.deepEqual(ids(byQuery), ['b'])
  assert.deepEqual(ids(byDifficulty), ['a', 'c'])
  assert.deepEqual(ids(byScoreMax), ['b', 'we', 'c'])
  assert.deepEqual(ids(byScoreMin), ['a', 'b'])
})

test('定数・スコアで並べ替え、値がない候補は方向に関わらず末尾に置くこと', () => {
  // When: 定数の昇順とスコアの降順・昇順で並べる。
  const byConstAsc = filterAndSortCourseCandidates(candidates, records, allFilter, {
    key: 'const',
    direction: 'asc',
  })
  const byScoreDesc = filterAndSortCourseCandidates(candidates, records, allFilter, {
    key: 'score',
    direction: 'desc',
  })
  const byScoreAsc = filterAndSortCourseCandidates(candidates, records, allFilter, {
    key: 'score',
    direction: 'asc',
  })

  // Then: WORLD'S ENDと未プレイは常に末尾で、元の順序を保つ。
  assert.deepEqual(ids(byConstAsc), ['b', 'c', 'a', 'we'])
  assert.deepEqual(ids(byScoreDesc), ['a', 'b', 'we', 'c'])
  assert.deepEqual(ids(byScoreAsc), ['b', 'a', 'we', 'c'])
})

test('曲名で並べ替えること', () => {
  // When: 曲名の降順で並べる。
  const result = filterAndSortCourseCandidates(candidates, records, allFilter, {
    key: 'title',
    direction: 'desc',
  })

  // Then: 日本語ロケールの比較で逆順になる。
  assert.deepEqual(ids(result), ['we', 'c', 'a', 'b'])
})

test('乱数に応じた位置の候補譜面を選ぶこと', () => {
  // Given: 4件の候補と、末尾寄りを指す乱数
  const random = () => 0.99

  // When
  const result = pickRandomCourseCandidate(candidates, random)

  // Then
  assert.equal(result?.id, 'c')
})

test('候補がない場合は undefined を返すこと', () => {
  // Given / When / Then
  assert.equal(pickRandomCourseCandidate([]), undefined)
})

test('保存した譜面キーを現在の候補へ戻し、固定枠と候補外のキーは捨てること', () => {
  // Given: 再取得で作り直された候補と、固定枠・候補外・正しいキーの組み合わせ
  const refetched = candidates.map((item) => ({ ...item }))
  const tracks = [
    { track_no: 1, selection_type: 'FIXED', candidates: [refetched[0]] },
    { track_no: 2, selection_type: 'RANDOM_POOL', candidates: refetched },
    { track_no: 3, selection_type: 'RANDOM_POOL', candidates: refetched },
  ] as unknown as CourseDetailDTO['tracks']
  const pickKeys = new Map([
    [1, 'a:MASTER'],
    [2, 'c:MASTER'],
    [3, 'missing:MASTER'],
  ])

  // When
  const result = resolveCoursePicks(tracks, pickKeys)

  // Then: ランダム枠の正しいキーだけが、作り直された候補のオブジェクトで返る
  assert.deepEqual([...result.keys()], [2])
  assert.equal(result.get(2), refetched[3])
})

import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerDataDifficulty, PlayerRecordDTO } from '../types/api'
import type { ChartScoresResponse } from '../types/chartScores'
import {
  inspectUnifiedWeakCharts,
  sortUnifiedWeakChartEntries,
  toAptitudeBarSpan,
  toAptitudeLabelPlacement,
} from './unifiedWeakChartInspector'

/** 統合インスペクターのテストで比較するレート帯。 */
const RATING_BAND = '16.00～16.24'

/** 理論値。 */
const MAX_SCORE = 1010000

/** テスト用レート帯平均の既定の失点。 */
const DEFAULT_AVERAGE_LOSS = 10000

/** テスト用の譜面別平均スコア。 */
type TestAverage = {
  songId: string
  difficulty: PlayerDataDifficulty
  averageScore: number | null
}

/**
 * テスト用の通常譜面レコードを生成する。
 *
 * @param id - 楽曲ID。
 * @param score - 獲得スコア。
 * @param difficulty - レコードの難易度。
 * @param overrides - 上書きするレコード項目。
 * @returns テスト用レコード。
 */
const createRecord = (
  id: string,
  score: number,
  difficulty: PlayerDataDifficulty = 'MASTER',
  overrides: Partial<PlayerRecordDTO> = {}
): PlayerRecordDTO => ({
  is_played: true,
  is_op_target: false,
  updated_at: null,
  difficulty,
  id,
  title: id,
  artist: 'テスト',
  const: 14,
  is_const_unknown: false,
  score,
  rating: 0,
  overpower: 0,
  justice_count: null,
  overpower_percent: 0,
  img: '',
  clear_lamp: null,
  combo_lamp: null,
  full_chain: null,
  slot: null,
  ...overrides,
})

/**
 * レート帯平均の一覧から難易度別スナップショットを生成する。
 *
 * @param averages - 楽曲ID・難易度ごとの平均スコア。
 * @returns テスト用スコア統計スナップショット。
 */
const createSnapshots = (averages: readonly TestAverage[]): ChartScoresResponse[] => {
  const chartsByDifficulty = new Map<PlayerDataDifficulty, ChartScoresResponse['charts']>()

  for (const { songId, difficulty, averageScore } of averages) {
    const charts = chartsByDifficulty.get(difficulty) ?? []
    charts.push({
      song_id: songId,
      scores: [{ rating_band: RATING_BAND, average_score: averageScore, median_score: null }],
    })
    chartsByDifficulty.set(difficulty, charts)
  }

  return [...chartsByDifficulty].map(([difficulty, charts]) => ({
    generated_at: '2026-01-01T00:00:00Z',
    difficulty,
    charts,
  }))
}

/**
 * テスト用データを統合インスペクターへ渡す。
 *
 * @param records - 分析するユーザーレコード。
 * @param averages - レート帯平均の一覧。
 * @returns 分類済みの譜面一覧。
 */
const inspect = (records: readonly PlayerRecordDTO[], averages: readonly TestAverage[]) =>
  inspectUnifiedWeakCharts(records, createSnapshots(averages), RATING_BAND)

/**
 * 理論値からの失点を指定してレコードと平均の組を作る。
 *
 * @param charts - 楽曲ID、譜面定数、自分の失点、平均の失点（既定は10,000点）の一覧。
 * @returns レコードとレート帯平均。
 */
const createCharts = (
  charts: readonly { id: string; chartConst?: number; loss: number; averageLoss?: number }[]
): { records: PlayerRecordDTO[]; averages: TestAverage[] } => ({
  records: charts.map(({ id, chartConst = 14, loss }) =>
    createRecord(id, MAX_SCORE - loss, 'MASTER', { const: chartConst })
  ),
  averages: charts.map(({ id, averageLoss = DEFAULT_AVERAGE_LOSS }) => ({
    songId: id,
    difficulty: 'MASTER',
    averageScore: MAX_SCORE - averageLoss,
  })),
})

/**
 * 平均の失点に対する失点の倍率がほぼ同じ譜面を作る。
 *
 * @param prefix - 楽曲IDの接頭辞。
 * @param chartConst - 譜面定数。
 * @param lossFactor - 平均の失点に対する自分の失点の倍率。
 * @returns 倍率の前後2%以内にばらついた9譜面。
 */
const createSteadyCharts = (prefix: string, chartConst: number, lossFactor: number) =>
  [-0.02, -0.015, -0.01, -0.005, 0, 0.005, 0.01, 0.015, 0.02].map((offset, index) => ({
    id: `${prefix}-${index}`,
    chartConst,
    loss: DEFAULT_AVERAGE_LOSS * lossFactor * (1 + offset),
  }))

/**
 * 小数の値が期待値に十分近いことを確かめる。
 *
 * @param actual - 実際の値。
 * @param expected - 期待値。
 * @returns なし。
 */
const assertClose = (actual: number | null, expected: number) => {
  assert.ok(actual !== null && Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`)
}

/**
 * 譜面IDと難易度から分類結果を取得する。
 *
 * @param entries - 分類済みの譜面一覧。
 * @param id - 楽曲ID。
 * @param difficulty - 難易度。
 * @returns 一致する分類結果。
 */
const findEntry = (
  entries: ReturnType<typeof inspect>,
  id: string,
  difficulty: PlayerDataDifficulty = 'MASTER'
) => {
  const entry = entries.find(
    (candidate) => candidate.record.id === id && candidate.record.difficulty === difficulty
  )
  assert.ok(entry, `分類結果がありません: ${id}:${difficulty}`)
  return entry
}

test('平均より失点が少なくても、普段の失点比より大きく劣る譜面は苦手にする', () => {
  // Given: 普段は平均の半分の失点で、1譜面だけ平均の0.9倍の失点にとどまる。
  const { records, averages } = createCharts([
    ...createSteadyCharts('steady', 14, 0.5),
    { id: 'target', loss: 9000 },
  ])

  // When: 統合分析を実行する。
  const target = findEntry(inspect(records, averages), 'target')

  // Then: 平均は上回っていても、普段より大きく劣るため得意度は下限の苦手になる。
  assert.ok((target.deviation ?? 0) < -3)
  assert.equal(target.aptitude, 20)
  assert.equal(target.category, 'weakness')
})

test('全体的に平均より失点が多くても、普段どおりの譜面は苦手にしない', () => {
  // Given: すべての譜面が平均の2倍前後の失点である。
  const { records, averages } = createCharts(createSteadyCharts('steady', 14, 2))

  // When: 統合分析を実行する。
  const entries = inspect(records, averages)

  // Then: 中心の譜面は得意度50のふつうで、苦手と判定される譜面はない。
  assert.equal(findEntry(entries, 'steady-4').aptitude, 50)
  assert.equal(findEntry(entries, 'steady-4').category, 'normal')
  assert.ok(entries.every(({ category }) => category !== 'weakness'))
})

test('点差が同じでも、高得点帯での上積みを高く評価する', () => {
  // Given: 普段は平均の半分の失点で、平均を1,000点上回る譜面が高得点帯と中得点帯にある。
  const { records, averages } = createCharts([
    ...createSteadyCharts('steady', 14, 0.5),
    { id: 'high-score', loss: 1000, averageLoss: 2000 },
    { id: 'middle-score', loss: 14000, averageLoss: 15000 },
  ])

  // When: 統合分析を実行する。
  const entries = inspect(records, averages)

  // Then: 高得点帯は失点を半分にしており普段どおり、中得点帯は失点がほぼ減っておらず苦手になる。
  assert.equal(findEntry(entries, 'high-score').category, 'normal')
  assert.equal(findEntry(entries, 'middle-score').category, 'weakness')
})

test('理論値付近の失点は下限点数として扱い、数十点の差を過敏に判定しない', () => {
  // Given: 平均どおりの譜面群に、理論値の譜面と、平均・自分とも失点100点未満の譜面を加える。
  const { records, averages } = createCharts([
    ...createSteadyCharts('steady', 14, 1),
    { id: 'theoretical', loss: 0, averageLoss: 1000 },
    { id: 'near-max', loss: 50, averageLoss: 10 },
  ])

  // When: 統合分析を実行する。
  const entries = inspect(records, averages)

  // Then: 理論値でも得意度は有限の上限に収まり、失点100点未満どうしの差はふつうになる。
  assert.equal(findEntry(entries, 'theoretical').aptitude, 80)
  assert.equal(findEntry(entries, 'theoretical').category, 'strength')
  assert.equal(findEntry(entries, 'near-max').category, 'normal')
})

test('普段の失点比は譜面定数の近い譜面だけで求める', () => {
  // Given: 定数12では平均の半分、定数15では平均どおりの失点が普段の失点比になる。
  const { records, averages } = createCharts([
    ...createSteadyCharts('low-const', 12, 0.5),
    ...createSteadyCharts('high-const', 15, 1),
    { id: 'low-target', chartConst: 12.5, loss: 7000 },
    { id: 'high-target', chartConst: 14.5, loss: 7000 },
  ])

  // When: 同じ失点の譜面を定数帯ごとに判定する。
  const entries = inspect(records, averages)

  // Then: 定数12付近では普段より劣り苦手、定数15付近では普段より優れて得意になる。
  assert.equal(findEntry(entries, 'low-target').category, 'weakness')
  assert.equal(findEntry(entries, 'high-target').category, 'strength')
})

test('定数の近い譜面が少ない場合は比較できる全譜面で普段の失点比を求める', () => {
  // Given: 定数10の譜面が1つだけで、他は定数14に集まっている。
  const { records, averages } = createCharts([
    ...createSteadyCharts('steady', 14, 0.5),
    { id: 'isolated', chartConst: 10, loss: 10000 },
  ])

  // When: 統合分析を実行する。
  const isolated = findEntry(inspect(records, averages), 'isolated')

  // Then: 全譜面の普段の失点比（平均の半分）と比べて苦手と判定する。
  assert.equal(isolated.category, 'weakness')
})

test('平均統計がない譜面はデータなしにし、普段の失点比の計算にも含めない', () => {
  // Given: 平均なしとnull平均の譜面を加える。
  const { records, averages } = createCharts(createSteadyCharts('steady', 14, 0.8))
  const baseline = findEntry(inspect(records, averages), 'steady-0').deviation
  records.push(createRecord('missing-average', 900000), createRecord('null-average', 900000))
  averages.push({ songId: 'null-average', difficulty: 'MASTER', averageScore: null })

  // When: 統合分析を実行する。
  const entries = inspect(records, averages)

  // Then: 平均なし譜面は得意度を持たず、他譜面のずれも変わらない。
  for (const id of ['missing-average', 'null-average']) {
    const entry = findEntry(entries, id)
    assert.equal(entry.category, 'unavailable')
    assert.equal(entry.deviation, null)
    assert.equal(entry.aptitude, null)
  }
  assert.equal(findEntry(entries, 'steady-0').deviation, baseline)
})

test('未プレイ譜面と理論値超過スコアを出力と普段の失点比の計算から除外する', () => {
  // Given: 適格な譜面に、未プレイの0点と上限を1点超える譜面を加える。
  const { records, averages } = createCharts(createSteadyCharts('steady', 14, 0.8))
  const baseline = findEntry(inspect(records, averages), 'steady-0').deviation
  records.push(
    createRecord('unplayed', 0, 'MASTER', { is_played: false }),
    createRecord('over-score', 1010001)
  )
  averages.push(
    { songId: 'unplayed', difficulty: 'MASTER', averageScore: 1000000 },
    { songId: 'over-score', difficulty: 'MASTER', averageScore: 0 }
  )

  // When: 全レコードを分析関数へ渡す。
  const entries = inspect(records, averages)

  // Then: 不適格レコードは結果に含まれず、ずれにも影響しない。
  assert.equal(entries.length, 9)
  assert.equal(findEntry(entries, 'steady-0').deviation, baseline)
})

test('失点比のばらつきがない場合も下限で割り、わずかなずれは過敏に判定しない', () => {
  // Given: 半数以上の譜面が平均どおりで、失点が5%多い譜面と3倍の譜面がある。
  const { records, averages } = createCharts([
    ...[0, 1, 2, 3, 4].map((index) => ({ id: `same-${index}`, loss: 10000 })),
    { id: 'near', loss: 10500 },
    { id: 'far', loss: 30000 },
  ])

  // When: 統合分析を実行する。
  const entries = inspect(records, averages)

  // Then: ばらつきを下限0.1として、5%の差はふつう、3倍の差は苦手になる。
  assert.equal(findEntry(entries, 'same-0').deviation, 0)
  assertClose(findEntry(entries, 'near').deviation, Math.log(10000 / 10500) / 0.1)
  assert.equal(findEntry(entries, 'near').aptitude, 45)
  assert.equal(findEntry(entries, 'near').category, 'normal')
  assert.equal(findEntry(entries, 'far').category, 'weakness')
})

test('同じ楽曲IDでも難易度ごとの平均を照合して判定する', () => {
  // Given: 平均どおりの譜面群に、同じ楽曲IDのMASTERとULTIMAを加える。
  const { records, averages } = createCharts(createSteadyCharts('steady', 14, 1))
  records.push(
    createRecord('shared-song', 1000000, 'MASTER'),
    createRecord('shared-song', 1000000, 'ULTIMA')
  )
  averages.push(
    { songId: 'shared-song', difficulty: 'MASTER', averageScore: 1005000 },
    { songId: 'shared-song', difficulty: 'ULTIMA', averageScore: 990000 }
  )

  // When: 楽曲IDと難易度を組み合わせてレート帯平均を照合する。
  const entries = inspect(records, averages)

  // Then: 各譜面の平均を取り違えず、MASTERは苦手、ULTIMAは得意になる。
  assert.equal(findEntry(entries, 'shared-song', 'MASTER').category, 'weakness')
  assert.equal(findEntry(entries, 'shared-song', 'ULTIMA').category, 'strength')
})

test('判定の優先順、ずれの小さい順、同点時の読み順で並べる', () => {
  // Given: 各判定に該当する譜面、平均なし譜面、読みと曲名の順が異なる同点譜面を用意する。
  const { records, averages } = createCharts([
    ...createSteadyCharts('steady', 14, 1),
    { id: 'weakness-farther', loss: 30000 },
    { id: 'weakness-nearer', loss: 20000 },
    { id: 'mild', loss: 11500 },
    { id: 'strength', loss: 8000 },
  ])
  const readingI = {
    ...createRecord('reading-i', 1000000, 'MASTER', { title: 'あ' }),
    reading: 'イ',
  }
  const readingA = {
    ...createRecord('reading-a', 1000000, 'MASTER', { title: 'い' }),
    reading: 'ア',
  }
  records.push(readingI, readingA, createRecord('unavailable', 1000000))
  averages.push(
    { songId: 'reading-i', difficulty: 'MASTER', averageScore: 1000000 },
    { songId: 'reading-a', difficulty: 'MASTER', averageScore: 1000000 }
  )

  // When: 分類結果を取得する。
  const entries = inspect(records, averages)
  const ids = entries.map(({ record }) => record.id)

  // Then: 判定の優先順を守り、判定内はずれの小さい順、同点は読み順にする。
  assert.deepEqual(ids.slice(0, 3), ['weakness-farther', 'weakness-nearer', 'mild'])
  assert.ok(ids.indexOf('reading-a') < ids.indexOf('reading-i'))
  assert.deepEqual(ids.slice(-2), ['strength', 'unavailable'])
  assert.deepEqual(
    [...new Set(entries.map(({ category }) => category))],
    ['weakness', 'mildWeakness', 'normal', 'strength', 'unavailable']
  )
})

test('ソート未指定の場合は判定の優先順位を保つ', () => {
  // Given: 判定の優先順位順に並んだ結果がある。
  const { records, averages } = createCharts([
    ...createSteadyCharts('steady', 14, 1),
    { id: 'weakness', loss: 30000 },
  ])
  const entries = inspect(records, averages)

  // When: ソートキーと方向を指定せずにソートする。
  const sorted = sortUnifiedWeakChartEntries(entries, null, null)

  // Then: 入力と同じ順序の新しい配列を返す。
  assert.notEqual(sorted, entries)
  assert.deepEqual(sorted, entries)
})

test('得意度でソートすると、平均がない譜面は方向にかかわらず末尾に置く', () => {
  // Given: 得意度の異なる譜面と、平均がない譜面がある。
  const { records, averages } = createCharts([
    { id: 'minus', loss: 11000 },
    { id: 'plus', loss: 9000 },
    { id: 'zero', loss: 10000 },
  ])
  records.push(createRecord('unavailable', 1000000))
  const entries = inspect(records, averages)

  // When: 得意度の昇順と降順でソートする。
  const ascending = sortUnifiedWeakChartEntries(entries, 'aptitude', 'asc')
  const descending = sortUnifiedWeakChartEntries(entries, 'aptitude', 'desc')

  // Then: 得意度順に並び、平均がない譜面はどちらも末尾になる。
  assert.deepEqual(
    ascending.map(({ record }) => record.id),
    ['minus', 'zero', 'plus', 'unavailable']
  )
  assert.deepEqual(
    descending.map(({ record }) => record.id),
    ['plus', 'zero', 'minus', 'unavailable']
  )
})

test('難易度はBASICからULTIMAの順でソートする', () => {
  // Given: 難易度の異なる譜面がある。
  const records = [
    createRecord('ultima', 1000000, 'ULTIMA'),
    createRecord('basic', 1000000, 'BASIC'),
    createRecord('master', 1000000, 'MASTER'),
    createRecord('expert', 1000000, 'EXPERT'),
  ]
  const entries = inspect(records, [])

  // When: 難易度の昇順でソートする。
  const sorted = sortUnifiedWeakChartEntries(entries, 'difficulty', 'asc')

  // Then: 難易度の定義順になる。
  assert.deepEqual(
    sorted.map(({ record }) => record.difficulty),
    ['BASIC', 'EXPERT', 'MASTER', 'ULTIMA']
  )
})

test('判定でソートすると優先順位の逆順になり、同じ判定内は入力順を保つ', () => {
  // Given: 苦手・ふつう・得意・データなしの譜面がある。
  const { records, averages } = createCharts([
    ...createSteadyCharts('steady', 14, 1),
    { id: 'weakness-farther', loss: 30000 },
    { id: 'weakness-nearer', loss: 20000 },
    { id: 'strength', loss: 8000 },
  ])
  records.push(createRecord('unavailable', 1000000))
  const entries = inspect(records, averages)

  // When: 判定の降順でソートする。
  const sorted = sortUnifiedWeakChartEntries(entries, 'category', 'desc')

  // Then: データなし、得意、ふつう、苦手の順で、苦手の中は入力順のまま並ぶ。
  assert.deepEqual(
    [...new Set(sorted.map(({ category }) => category))],
    ['unavailable', 'strength', 'normal', 'weakness']
  )
  assert.deepEqual(
    sorted.slice(-2).map(({ record }) => record.id),
    ['weakness-farther', 'weakness-nearer']
  )
})

test('得意度バーは中心から得意度の方向へ、上限・下限で半分の幅まで塗る', () => {
  // Given: 下限、中心、中間、上限の得意度がある。
  const aptitudes = [20, 50, 65, 80]

  // When: 塗りの範囲を求める。
  const spans = aptitudes.map(toAptitudeBarSpan)

  // Then: 50未満は中心から左へ、50超は中心から右へ伸びる。
  assert.deepEqual(spans, [
    { left: 0, width: 50 },
    { left: 50, width: 0 },
    { left: 50, width: 25 },
    { left: 50, width: 50 },
  ])
})

test('得意度の数値は塗りが長ければ先端の内側、短ければ先端の外側に置く', () => {
  // Given: 長い塗り（20, 80）と短い塗り（45, 50, 55）の得意度がある。
  const aptitudes = [20, 45, 50, 55, 80]

  // When: 数値の配置を求める。
  const placements = aptitudes.map(toAptitudeLabelPlacement)

  // Then: 内側なら中心側へ、外側なら中心から離れる側へ寄せる。
  assert.deepEqual(
    placements.map(({ beforeAnchor, inside }) => ({ beforeAnchor, inside })),
    [
      { beforeAnchor: false, inside: true },
      { beforeAnchor: true, inside: false },
      { beforeAnchor: false, inside: false },
      { beforeAnchor: false, inside: false },
      { beforeAnchor: true, inside: true },
    ]
  )
  assert.equal(placements[0].anchor, 0)
  assert.equal(placements[4].anchor, 100)
})

test('得意度の数値は塗りが全幅の20%以上で内側、未満で外側に置く', () => {
  // Given: 塗りが全幅のちょうど20%（38, 62）と、それより短い（39, 61）得意度がある。
  const aptitudes = [38, 39, 61, 62]

  // When: 数値の配置を求める。
  const insides = aptitudes.map((aptitude) => toAptitudeLabelPlacement(aptitude).inside)

  // Then: 20%ちょうどは内側、未満は外側になる。
  assert.deepEqual(insides, [true, false, false, true])
})

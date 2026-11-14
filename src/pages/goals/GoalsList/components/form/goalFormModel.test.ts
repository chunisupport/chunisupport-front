import assert from 'node:assert/strict'
import test from 'node:test'
import { CHART_CONST_MAX, CHART_CONST_MIN } from '../../../../../constants/chart'
import type { GoalDTO } from '../../../../../types/api'
import {
  buildDefaultDifficultySelections,
  buildGoalFormAchievementParams,
  buildGoalFormAttributes,
  buildGoalFormGaugeStartParams,
  createDefaultGoalConstSelection,
  createGoalFormInitialState,
  getDefaultTotalGoalValue,
  getRankGoalScore,
  resolveGoalFormGaugeStart,
  toggleSelection,
} from './goalFormModel'

const selectionFallbacks = {
  allDifficultySelections: ['1', '2', '3'],
  allGenreSelections: ['10', '20'],
  allVersionSelections: ['1', '2'],
  allNameFolderSelections: ['A', 'KA', 'SA'],
  defaultDifficultySelections: ['3'],
}

test('作成フォームの初期状態はMASTER/ULTIMA選択と標準値で作成される', () => {
  // Given / When
  const result = createGoalFormInitialState(undefined, selectionFallbacks)

  // Then
  assert.equal(result.title, '')
  assert.equal(result.achievementType, 'rank_count')
  assert.equal(result.rank, 'S')
  assert.equal(result.countMode, 'all')
  assert.equal(result.invertValue, false)
  assert.equal(result.invertPercentage, false)
  assert.equal(result.gaugeStartMode, 'zero')
  assert.equal(result.gaugeStart, '')
  assert.equal(result.applyGaugeStartToPercentage, true)
  assert.equal(result.chartTargetMode, 'normal')
  assert.deepEqual(result.constSelection, {
    constFilterMode: 'level',
    constRange: { min: CHART_CONST_MIN, max: CHART_CONST_MAX },
  })
  assert.deepEqual(result.diffs, selectionFallbacks.defaultDifficultySelections)
  assert.deepEqual(result.genres, selectionFallbacks.allGenreSelections)
  assert.deepEqual(result.versions, selectionFallbacks.allVersionSelections)
  assert.deepEqual(result.nameFolders, selectionFallbacks.allNameFolderSelections)
})

test('作成フォームの難易度初期選択はMASTERとULTIMAだけを含む', () => {
  // Given: BASIC〜ULTIMA を含む難易度マスタデータ（表記揺れを含む）
  const difficulties = [
    { id: 1, name: 'basic' },
    { id: 2, name: 'ADVANCED' },
    { id: 3, name: 'EXPERT' },
    { id: 4, name: 'master' },
    { id: 5, name: 'ULTIMA' },
  ]

  // When: 初期選択難易度を構築する
  const result = buildDefaultDifficultySelections(difficulties)

  // Then: 大文字正規化のうえ MASTER と ULTIMA だけが選択される
  assert.deepEqual(result, ['4', '5'])
})

test('編集フォームでdiffが未指定の場合は全難易度が選択される', () => {
  // Given: diff を含まない保存済み目標
  const goal = {
    id: 1,
    group_id: null,
    title: '全難易度目標',
    achievement_type: 'rank_count',
    achievement_params: { score: 1000000 },
    attributes: { genre: [10], ver: [2] },
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When: 編集用初期状態を作成する
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then: 未指定の難易度は全選択のフォールバックで補完される
  assert.deepEqual(result.diffs, selectionFallbacks.allDifficultySelections)
})

test('編集フォームの初期状態は保存済み目標から復元される', () => {
  // Given
  const goal = {
    id: 1,
    group_id: 2,
    title: '虹レ目標',
    achievement_type: 'hardlamp_count',
    achievement_params: { lamp: 'ABS', remaining: 2 },
    attributes: {
      diff: 3,
      const: { min: 13.5, max: 15 },
      genre: [10],
      ver: [2],
      name_folder: 'KA',
    },
    invert_value: true,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then
  assert.equal(result.title, '虹レ目標')
  assert.equal(result.achievementType, 'hardlamp_count')
  assert.equal(result.hardLamp, 'ABS')
  assert.equal(result.count, '2')
  assert.equal(result.countMode, 'remaining')
  assert.equal(result.invertValue, true)
  assert.equal(result.invertPercentage, false)
  assert.deepEqual(result.diffs, ['3'])
  assert.deepEqual(result.constSelection, {
    constFilterMode: 'number',
    constRange: { min: 13.5, max: 15 },
  })
  assert.deepEqual(result.genres, ['10'])
  assert.deepEqual(result.versions, ['2'])
  assert.deepEqual(result.nameFolders, ['KA'])
})

test('編集フォームはレベル指定で保存した目標をレベル指定で復元する', () => {
  // Given: レベル14〜14+で保存した目標
  const goal = {
    id: 1,
    group_id: null,
    title: 'レベル14 AJ',
    achievement_type: 'combolamp_count',
    achievement_params: { lamp: 'AJ', count: 10 },
    attributes: { diff: 4, const: { min: 14, max: 14.9 }, const_filter_mode: 'level' },
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then
  assert.deepEqual(result.constSelection, {
    constFilterMode: 'level',
    constRange: { min: 14, max: 14.9 },
  })
})

test('対象属性は通常条件とOP対象条件をAPI送信用に変換する', () => {
  // Given / When
  const normalAttributes = buildGoalFormAttributes({
    achievementType: 'score_count',
    chartTargetMode: 'normal',
    diffs: ['1', '2'],
    constSelection: { constFilterMode: 'number', constRange: { min: 13, max: 15 } },
    genres: ['10'],
    versions: ['1', '2'],
    nameFolders: ['A', 'KA', 'SA'],
    allNameFolders: ['A', 'KA', 'SA'],
  })
  const opTargetAttributes = buildGoalFormAttributes({
    achievementType: 'overpower_value',
    chartTargetMode: 'op_target',
    diffs: ['1'],
    constSelection: { constFilterMode: 'level', constRange: { min: 14, max: 14.9 } },
    genres: [],
    versions: ['2'],
    nameFolders: ['A', 'KA', 'SA'],
    allNameFolders: ['A', 'KA', 'SA'],
  })

  // Then
  assert.deepEqual(normalAttributes, {
    diff: [1, 2],
    const: { min: 13, max: 15 },
    const_filter_mode: 'number',
    genre: 10,
    ver: [1, 2],
  })
  assert.deepEqual(opTargetAttributes, {
    chart_target: 'OP_TARGET',
    const: { min: 14, max: 14.9 },
    const_filter_mode: 'level',
    genre: [],
    ver: 2,
  })
})

test('虹枠目標の対象属性から難易度・定数範囲と入力方法・OP対象を除外する', () => {
  // Given / When
  const attributes = buildGoalFormAttributes({
    achievementType: 'rainbow_count',
    chartTargetMode: 'op_target',
    diffs: ['4'],
    constSelection: { constFilterMode: 'level', constRange: { min: 13, max: 15.9 } },
    genres: ['10'],
    versions: ['2'],
    nameFolders: ['SA', 'A'],
    allNameFolders: ['A', 'KA', 'SA'],
  })

  // Then
  assert.deepEqual(attributes, {
    genre: 10,
    ver: 2,
    name_folder: ['A', 'SA'],
  })
})

test('楽曲名順は全選択なら属性から省略し、1件なら単一コードで送信する', () => {
  // Given
  const baseInput = {
    achievementType: 'score_count' as const,
    chartTargetMode: 'normal' as const,
    diffs: ['4'],
    constSelection: createDefaultGoalConstSelection(),
    genres: ['10'],
    versions: ['2'],
    allNameFolders: ['A', 'KA', 'SA'],
  }

  // When
  const allSelected = buildGoalFormAttributes({ ...baseInput, nameFolders: ['SA', 'KA', 'A'] })
  const singleSelected = buildGoalFormAttributes({ ...baseInput, nameFolders: ['KA'] })
  const noneSelected = buildGoalFormAttributes({ ...baseInput, nameFolders: [] })

  // Then
  assert.equal('name_folder' in allSelected, false)
  assert.equal(singleSelected.name_folder, 'KA')
  assert.deepEqual(noneSelected.name_folder, [])
})

test('成果パラメータは目標種別と指定方法に応じて組み立てられる', () => {
  // Given / When
  const scoreCountParams = buildGoalFormAchievementParams({
    achievementType: 'score_count',
    score: '1009000',
    rank: 'S',
    count: '30',
    countMode: 'number',
    total: '10',
    totalMode: 'number',
    hardLamp: 'HRD',
    comboLamp: 'FC',
    fullChain: 'GOLD',
  })
  const totalScoreParams = buildGoalFormAchievementParams({
    achievementType: 'total_score',
    score: '0',
    rank: 'S',
    count: '1',
    countMode: 'all',
    total: '5',
    totalMode: 'remaining',
    hardLamp: 'HRD',
    comboLamp: 'FC',
    fullChain: 'GOLD',
  })

  const fullChainParams = buildGoalFormAchievementParams({
    achievementType: 'fullchain_count',
    score: '0',
    rank: 'S',
    count: '75',
    countMode: 'percent',
    total: '0',
    totalMode: 'number',
    hardLamp: 'HRD',
    comboLamp: 'FC',
    fullChain: 'PLATINUM',
  })

  // Then
  assert.deepEqual(scoreCountParams, { score: 1009000, count: 30 })
  assert.deepEqual(totalScoreParams, { remaining: 5 })
  assert.deepEqual(fullChainParams, { lamp: 'PLATINUM', percent: 75 })
})

test('単曲レート達成数の成果パラメータはレートと件数指定方法を保持する', () => {
  // Given / When
  const params = buildGoalFormAchievementParams({
    achievementType: 'rating_count',
    score: '0',
    rating: '18.00',
    rank: 'S',
    count: '50',
    countMode: 'percent',
    total: '0',
    totalMode: 'number',
    hardLamp: 'HRD',
    comboLamp: 'FC',
    fullChain: 'GOLD',
  })

  // Then
  assert.deepEqual(params, { rating: 18, percent: 50 })
})

test('単曲レート達成数の編集状態はレートと残数指定を復元する', () => {
  // Given
  const goal = {
    id: 3,
    group_id: null,
    title: '単曲18を増やす',
    achievement_type: 'rating_count',
    achievement_params: { rating: 18, remaining: 1 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-09-07T00:00:00Z',
  } satisfies GoalDTO

  // When
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then
  assert.equal(result.rating, '18')
  assert.equal(result.count, '1')
  assert.equal(result.countMode, 'remaining')
})

test('FULL CHAIN目標の編集状態は保存済みランプと全件指定を復元する', () => {
  // Given
  const goal = {
    id: 2,
    group_id: null,
    title: 'プラチナ制覇',
    achievement_type: 'fullchain_count',
    achievement_params: { lamp: 'PLATINUM' },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-09-02T00:00:00Z',
  } satisfies GoalDTO

  // When
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then
  assert.equal(result.fullChain, 'PLATINUM')
  assert.equal(result.countMode, 'all')
})

test('編集フォームは保存済みのスタート位置を「任意の数値から」として復元する', () => {
  // Given: スタート位置を持ち、達成率へは適用しない保存済み目標
  const goal = {
    id: 1,
    group_id: null,
    title: 'OP達成率99.8%',
    achievement_type: 'overpower_percent',
    achievement_params: { total: 99.8 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 99.6,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then: 「現在値から」は保存時点の値として記録されるため、数値として編集できる形に戻す
  assert.equal(result.gaugeStartMode, 'custom')
  assert.equal(result.gaugeStart, '99.6')
  assert.equal(result.applyGaugeStartToPercentage, false)
})

test('スタート位置が未設定の目標は「最初から」と達成率への適用の既定値で復元する', () => {
  // Given: スタート位置が0のため、適用指定がfalseで保存された目標
  const goal = {
    id: 1,
    group_id: null,
    title: 'AJ 100譜面',
    achievement_type: 'combolamp_count',
    achievement_params: { lamp: 'AJ', count: 100 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then
  assert.equal(result.gaugeStartMode, 'zero')
  assert.equal(result.gaugeStart, '')
  assert.equal(result.applyGaugeStartToPercentage, true)
})

test('スタート位置は決め方に応じて0・現在値・入力値から解決される', () => {
  // Given
  const base = {
    achievementType: 'overpower_percent',
    gaugeStart: '99.6',
    current: 99.71234,
  } as const

  // When
  const zero = resolveGoalFormGaugeStart({ ...base, gaugeStartMode: 'zero' })
  const current = resolveGoalFormGaugeStart({ ...base, gaugeStartMode: 'current' })
  const custom = resolveGoalFormGaugeStart({ ...base, gaugeStartMode: 'custom' })

  // Then: 現在値は目標種別で保存できる小数第3位までに切り捨てる
  assert.equal(zero, 0)
  assert.equal(current, 99.712)
  assert.equal(custom, 99.6)
})

for (const { name, achievementType, current, expected } of [
  {
    name: '平均スコアの小数を切り捨てる',
    achievementType: 'avg_score',
    current: 1007600.7,
    expected: 1007600,
  },
  {
    name: '件数の小数を切り捨てる',
    achievementType: 'combolamp_count',
    current: 950.9,
    expected: 950,
  },
  {
    name: '件数の整数値を保持する',
    achievementType: 'combolamp_count',
    current: 950,
    expected: 950,
  },
] as const) {
  test(`現在値からスタート位置を決めるとき${name}こと`, () => {
    // Given: 現在値からスタート位置を決めるフォーム。
    const input = { achievementType, gaugeStartMode: 'current', gaugeStart: '', current } as const

    // When: スタート位置を解決する。
    const result = resolveGoalFormGaugeStart(input)

    // Then: 整数のスタート位置を返す。
    assert.equal(result, expected)
  })
}

test('ゲージ設定は「最初から」なら達成率への適用をfalseにして送信する', () => {
  // Given
  const base = {
    achievementType: 'overpower_percent',
    gaugeStart: '99.6',
    current: 99.7,
    applyGaugeStartToPercentage: true,
  } as const

  // When
  const custom = buildGoalFormGaugeStartParams({ ...base, gaugeStartMode: 'custom' })
  const zero = buildGoalFormGaugeStartParams({ ...base, gaugeStartMode: 'zero' })

  // Then
  assert.deepEqual(custom, { gauge_start: 99.6, apply_gauge_start_to_percentage: true })
  assert.deepEqual(zero, { gauge_start: 0, apply_gauge_start_to_percentage: false })
})

test('平均スコア目標は割合を表示しないため達成率への適用をfalseにして送信する', () => {
  // Given / When
  const result = buildGoalFormGaugeStartParams({
    achievementType: 'avg_score',
    gaugeStartMode: 'current',
    gaugeStart: '',
    current: 1007000,
    applyGaugeStartToPercentage: true,
  })

  // Then
  assert.deepEqual(result, { gauge_start: 1007000, apply_gauge_start_to_percentage: false })
})

test('「現在値から」で現在値が0なら達成率への適用をfalseにして送信する', () => {
  // Given / When
  const withCurrent = buildGoalFormGaugeStartParams({
    achievementType: 'combolamp_count',
    gaugeStartMode: 'current',
    gaugeStart: '',
    current: 950,
    applyGaugeStartToPercentage: true,
  })
  const withoutCurrent = buildGoalFormGaugeStartParams({
    achievementType: 'combolamp_count',
    gaugeStartMode: 'current',
    gaugeStart: '',
    current: 0,
    applyGaugeStartToPercentage: true,
  })

  // Then
  assert.deepEqual(withCurrent, { gauge_start: 950, apply_gauge_start_to_percentage: true })
  assert.deepEqual(withoutCurrent, { gauge_start: 0, apply_gauge_start_to_percentage: false })
})

test('「任意の数値から」が空欄の間はスタート位置をNaNにし、達成率への適用をfalseにする', () => {
  // Given / When: プレビューはNaNを0から描く扱いにし、保存前検証で止める
  const result = buildGoalFormGaugeStartParams({
    achievementType: 'overpower_percent',
    gaugeStartMode: 'custom',
    gaugeStart: '',
    current: 99.7,
    applyGaugeStartToPercentage: true,
  })

  // Then
  assert.ok(Number.isNaN(result.gauge_start))
  assert.equal(result.apply_gauge_start_to_percentage, false)
})

test('平均スコア目標のスタート位置は「任意の数値から」と達成率への適用の既定値で復元する', () => {
  // Given: 平均スコア目標は適用指定をfalseで保存する
  const goal = {
    id: 1,
    group_id: null,
    title: '平均1,008,000',
    achievement_type: 'avg_score',
    achievement_params: { score: 1008000 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 1007000,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then: 他の目標種別へ変えたときに標準の適用指定で始められるよう、既定値を使う
  assert.equal(result.gaugeStartMode, 'custom')
  assert.equal(result.gaugeStart, '1007000')
  assert.equal(result.applyGaugeStartToPercentage, true)
})

test('ランク目標の保存用スコアはTHEORETICALと通常ランクで切り替わること', () => {
  // Given: ランク目標の選択値
  // When: 保存用スコアへ変換する
  const theoretical = getRankGoalScore('THEORETICAL')
  const normal = getRankGoalScore('S')

  // Then: THEORETICALは上限、通常ランクは下限スコアになる
  assert.equal(theoretical, 1010000)
  assert.equal(normal, 975000)
})

test('目標値入力の初期値は種別ごとに切り替わること', () => {
  // Given: 目標種別ごとの目標値入力欄
  // When: 初期値を取得する
  const totalScore = getDefaultTotalGoalValue('total_score')
  const overpowerValue = getDefaultTotalGoalValue('overpower_value')
  const overpowerPercent = getDefaultTotalGoalValue('overpower_percent')
  const rankCount = getDefaultTotalGoalValue('rank_count')

  // Then: 種別に応じた初期値になる
  assert.equal(totalScore, '1000000')
  assert.equal(overpowerValue, '10')
  assert.equal(overpowerPercent, '90')
  assert.equal(rankCount, '10')
})

test('チェックを外すと対象だけが選択から外れること', () => {
  // Given: 2件選択中の状態
  const current = ['1', '2']

  // When: 1件のチェックを外す
  const result = toggleSelection(current, '1', false)

  // Then: 外した対象だけが取り除かれる
  assert.deepEqual(result, ['2'])
})

test('コンボランプ目標の編集状態はハードランプを既定値で復元すること', () => {
  // Given: コンボランプAJで保存した目標
  const goal = {
    id: 11,
    group_id: null,
    title: 'AJ目標',
    achievement_type: 'combolamp_count',
    achievement_params: { lamp: 'AJ', count: 10 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When: 編集用初期状態を作成する
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then: ハードランプは既定値のままになる
  assert.equal(result.hardLamp, 'HRD')
})

test('ハードランプ目標の編集状態はコンボランプを既定値で復元すること', () => {
  // Given: ハードランプABSで保存した目標
  const goal = {
    id: 12,
    group_id: null,
    title: 'ABS目標',
    achievement_type: 'hardlamp_count',
    achievement_params: { lamp: 'ABS', count: 10 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When: 編集用初期状態を作成する
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then: コンボランプは既定値のままになる
  assert.equal(result.comboLamp, 'FC')
})

test('ハードランプ目標の編集状態はFULL CHAINを既定値で復元すること', () => {
  // Given: ハードランプABSで保存した目標
  const goal = {
    id: 13,
    group_id: null,
    title: 'ABS目標',
    achievement_type: 'hardlamp_count',
    achievement_params: { lamp: 'ABS', count: 10 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When: 編集用初期状態を作成する
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then: FULL CHAINは既定値のままになる
  assert.equal(result.fullChain, 'GOLD')
})

test('単曲レートの編集状態は既定値と異なるレートを復元すること', () => {
  // Given: レート17.5で保存した目標
  const goal = {
    id: 14,
    group_id: null,
    title: '単曲17.5を増やす',
    achievement_type: 'rating_count',
    achievement_params: { rating: 17.5, count: 5 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When: 編集用初期状態を作成する
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then: 保存したレートが文字列で復元される
  assert.equal(result.rating, '17.5')
})

test('ランク件数目標の編集状態は保存済みスコアのランクを復元すること', () => {
  // Given: SSS+相当のスコアで保存したランク件数目標
  const goal = {
    id: 15,
    group_id: null,
    title: 'SSS+目標',
    achievement_type: 'rank_count',
    achievement_params: { score: 1009000, count: 5 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When: 編集用初期状態を作成する
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then: SSS+が復元される
  assert.equal(result.rank, 'SSS+')
})

test('スコア件数目標の編集状態はランクを既定値で復元すること', () => {
  // Given: SSS+相当のスコアで保存したスコア件数目標
  const goal = {
    id: 16,
    group_id: null,
    title: 'スコア目標',
    achievement_type: 'score_count',
    achievement_params: { score: 1009000, count: 5 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When: 編集用初期状態を作成する
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then: ランク件数ではないため既定値のSになる
  assert.equal(result.rank, 'S')
})

test('合計スコア目標の編集状態は保存済みの合計値を復元すること', () => {
  // Given: 合計5で保存した合計スコア目標
  const goal = {
    id: 17,
    group_id: null,
    title: '合計目標',
    achievement_type: 'total_score',
    achievement_params: { total: 5 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When: 編集用初期状態を作成する
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then: 保存した合計値が文字列で復元される
  assert.equal(result.total, '5')
})

test('編集フォームはOP対象指定を復元すること', () => {
  // Given: OP対象と通常条件で保存した目標
  const opGoal = {
    id: 18,
    group_id: null,
    title: 'OP対象目標',
    achievement_type: 'score_count',
    achievement_params: { score: 1009000, count: 5 },
    attributes: { chart_target: 'OP_TARGET' },
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO
  const normalGoal = {
    id: 19,
    group_id: null,
    title: '通常目標',
    achievement_type: 'score_count',
    achievement_params: { score: 1009000, count: 5 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When: 編集用初期状態を作成する
  const opResult = createGoalFormInitialState(opGoal, selectionFallbacks)
  const normalResult = createGoalFormInitialState(normalGoal, selectionFallbacks)

  // Then: OP対象指定が復元される
  assert.equal(opResult.chartTargetMode, 'op_target')
  assert.equal(normalResult.chartTargetMode, 'normal')
})

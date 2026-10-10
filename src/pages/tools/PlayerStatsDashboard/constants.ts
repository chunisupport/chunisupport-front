import {
  MASTER_ULTIMA_FILTER,
  THEORETICAL_OVER_POWER_TARGET_FILTER,
} from '../../../constants/chart'
import type {
  PlayerStatsAchievement,
  PlayerStatsCandidateTarget,
  PlayerStatsDifficulty,
  PlayerStatsLevelAchievement,
} from '../../../utils/playerStatsDashboard'

/** ダッシュボード画面の表示文言。タイトルと説明文はツール一覧の定義を参照すること。 */
export const PLAYER_STATS_COPY = {
  overviewTitle: '現在地',
  overviewCaption: '選択した難易度の主要な達成状況',
  achievementTitle: '達成状況',
  achievementRateSuffix: 'の達成率',
  heatmapTitle: '達成率分布',
  heatmapPercentToggle: '%表示',
  levelCaption: '譜面定数から換算したレベル別の累計達成状況',
  chartConstantCaption: '譜面定数別の累計達成状況',
  milestoneTitle: '次のマイルストーン',
  candidateTitle: '狙い目の譜面',
  candidateEmpty: '現在の条件に候補譜面はありません',
  totalCharts: '全譜面',
  totalHighScore: 'トータルハイスコア',
  averageScore: '平均スコア',
  sss: 'SSS',
  allJustice: 'ALL JUSTICE',
  max: 'ALL JUSTICE CRITICAL',
  achievementCountSuffix: '譜面',
  justiceGapSuffix: ' J',
  fullComboCandidate: 'FC',
  milestoneRemainingPrefix: 'あと',
  milestoneRemainingSuffix: '譜面',
  milestoneTargetSuffix: '譜面まで',
  milestoneComplete: '達成済み',
  heatmapCountSeparator: '/',
  filterButtonLabel: '集計対象を絞り込む',
  filterButtonActiveLabel: '集計対象を絞り込む（条件変更あり）',
  filterTitle: '集計対象フィルター',
  difficultyLabel: '難易度',
  cancel: 'キャンセル',
  apply: '適用',
} as const

/** 平均スコアで切り捨て・固定表示する小数点以下桁数。 */
export const PLAYER_STATS_SCORE_DECIMAL_PLACES = 2

/** 難易度フィルター1件分の値と表示名 */
export type PlayerStatsDifficultyOption = {
  value: PlayerStatsDifficulty
  label: string
}

/** 統計画面の難易度選択肢 */
export const PLAYER_STATS_DIFFICULTY_OPTIONS: PlayerStatsDifficultyOption[] = [
  { value: 'ALL', label: '全難易度' },
  { value: MASTER_ULTIMA_FILTER, label: 'MASTER+ULTIMA' },
  { value: THEORETICAL_OVER_POWER_TARGET_FILTER, label: 'OP対象' },
  { value: 'BASIC', label: 'BASIC' },
  { value: 'ADVANCED', label: 'ADVANCED' },
  { value: 'EXPERT', label: 'EXPERT' },
  { value: 'MASTER', label: 'MASTER' },
  { value: 'ULTIMA', label: 'ULTIMA' },
]

/** 集計対象フィルターの入力欄IDの接頭辞 */
export const PLAYER_STATS_FILTER_ID_PREFIX = 'player-stats-filter'

/** 統計画面で初期集計する難易度 */
export const PLAYER_STATS_DEFAULT_DIFFICULTY: PlayerStatsDifficulty = MASTER_ULTIMA_FILTER

/** 達成状況タブの種別 */
export type PlayerStatsAchievementGroup = 'rank' | 'combo' | 'hard'

/** 達成状況タブの表示選択肢 */
export const PLAYER_STATS_ACHIEVEMENT_GROUP_OPTIONS = [
  { value: 'rank', label: 'RANK' },
  { value: 'combo', label: 'COMBO' },
  { value: 'hard', label: 'HARD' },
] as const

/** 達成状況タブごとの累計到達条件 */
export const PLAYER_STATS_ACHIEVEMENTS: Record<
  PlayerStatsAchievementGroup,
  readonly PlayerStatsAchievement[]
> = {
  rank: ['s', 'sPlus', 'ss', 'ssPlus', 'sss', 'sssPlus', 'max'],
  combo: ['played', 'fc', 'aj', 'max'],
  hard: ['played', 'clear', 'hard', 'brave', 'absolute', 'catastrophe'],
}

/** 次のマイルストーンの表示選択肢 */
export const PLAYER_STATS_MILESTONE_OPTIONS = [
  { value: 'sss', label: 'SSS' },
  { value: 'sssPlus', label: 'SSS+' },
  { value: 'aj', label: 'AJ' },
  { value: 'max', label: 'AJC' },
] as const satisfies readonly { value: PlayerStatsCandidateTarget; label: string }[]

/** 次に狙う譜面タブの表示選択肢 */
export const PLAYER_STATS_CANDIDATE_OPTIONS = [
  { value: 'sss', label: 'SSS' },
  { value: 'sssPlus', label: 'SSS+' },
  { value: 'aj', label: 'AJ' },
  { value: 'max', label: 'AJC' },
] as const satisfies readonly { value: PlayerStatsCandidateTarget; label: string }[]

/** 候補リストに表示する最大譜面数 */
export const PLAYER_STATS_CANDIDATE_LIMIT = 15

/** 達成率分布の行定義 */
export const PLAYER_STATS_HEATMAP_METRICS: Record<
  PlayerStatsAchievementGroup,
  readonly { key: PlayerStatsLevelAchievement; label: string }[]
> = {
  rank: [
    { key: 's', label: 'S' },
    { key: 'sPlus', label: 'S+' },
    { key: 'ss', label: 'SS' },
    { key: 'ssPlus', label: 'SS+' },
    { key: 'sss', label: 'SSS' },
    { key: 'sssPlus', label: 'SSS+' },
  ],
  combo: [
    { key: 'fc', label: 'FC' },
    { key: 'aj', label: 'AJ' },
    { key: 'ajc', label: 'AJC' },
  ],
  hard: [
    { key: 'clear', label: 'CLEAR' },
    { key: 'hard', label: 'HARD' },
    { key: 'brave', label: 'BRAVE' },
    { key: 'absolute', label: 'ABSOLUTE' },
    { key: 'catastrophe', label: 'CATASTROPHY' },
  ],
}

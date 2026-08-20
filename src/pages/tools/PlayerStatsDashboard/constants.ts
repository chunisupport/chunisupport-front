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

/** ダッシュボード画面の表示文言。 */
export const PLAYER_STATS_COPY = {
  pageTitle: 'ダッシュボード',
  documentTitle: 'ダッシュボード',
  updatedAt: 'レコード更新',
  difficultyLabel: '集計する難易度',
  overviewTitle: '現在地',
  overviewCaption: '選択した難易度の主要な達成状況',
  achievementTitle: '達成状況',
  achievementRateSuffix: 'の達成率',
  levelTitle: 'レベル別達成率',
  levelCaption: '譜面定数から換算したレベル別の累計達成状況',
  levelNotice: '定数未確定譜面は推定定数のレベルへ集計',
  milestoneTitle: '次のマイルストーン',
  candidateTitle: '次に狙う譜面候補',
  candidateEmpty: '現在の条件に候補譜面はありません',
  totalCharts: '全譜面',
  playedCharts: 'プレイ済み',
  averageScore: '平均スコア',
  sssPlus: 'SSS+',
  allJustice: 'ALL JUSTICE',
  max: 'MAX',
  level: 'LEVEL',
  achievementCountSuffix: '譜面',
  scoreGapPrefix: 'あと',
  scoreGapSuffix: '点',
  fullComboCandidate: 'FULL COMBO達成済み',
  currentRankPrefix: '現在',
  milestoneRemainingPrefix: 'あと',
  milestoneRemainingSuffix: '譜面',
  milestoneTargetSuffix: '譜面を目指す',
  milestoneComplete: '達成済み',
  heatmapCountSeparator: '/',
} as const

/** 難易度フィルター1件分の値と表示名。 */
export type PlayerStatsDifficultyOption = {
  value: PlayerStatsDifficulty
  label: string
}

/** 統計画面の難易度選択肢。 */
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

/** 達成状況タブの種別。 */
export type PlayerStatsAchievementGroup = 'rank' | 'combo' | 'hard'

/** 達成状況タブの表示選択肢。 */
export const PLAYER_STATS_ACHIEVEMENT_GROUP_OPTIONS = [
  { value: 'rank', label: 'RANK' },
  { value: 'combo', label: 'COMBO' },
  { value: 'hard', label: 'HARD' },
] as const

/** 達成状況タブごとの累計到達条件。 */
export const PLAYER_STATS_ACHIEVEMENTS: Record<
  PlayerStatsAchievementGroup,
  readonly PlayerStatsAchievement[]
> = {
  rank: ['played', 's', 'ss', 'sss', 'sssPlus', 'max'],
  combo: ['played', 'fc', 'aj', 'max'],
  hard: ['played', 'clear', 'hard', 'brave', 'absolute', 'catastrophe'],
}

/** 累計到達条件の表示名。 */
export const PLAYER_STATS_ACHIEVEMENT_LABEL: Record<PlayerStatsAchievement, string> = {
  played: 'プレイ済み',
  s: 'S',
  sPlus: 'S+',
  ss: 'SS',
  ssPlus: 'SS+',
  sss: 'SSS',
  sssPlus: 'SSS+',
  fc: 'FULL COMBO',
  aj: 'ALL JUSTICE',
  ajc: 'ALL JUSTICE CRITICAL',
  max: 'MAX',
  clear: 'CLEAR',
  hard: 'HARD',
  brave: 'BRAVE',
  absolute: 'ABSOLUTE',
  catastrophe: 'CATASTROPHY',
}

/** 次に狙う譜面タブの表示選択肢。 */
export const PLAYER_STATS_CANDIDATE_OPTIONS = [
  { value: 'sssPlus', label: 'SSS+' },
  { value: 'aj', label: 'AJ（参考）' },
  { value: 'max', label: 'MAX' },
] as const satisfies readonly { value: PlayerStatsCandidateTarget; label: string }[]

/** 候補リストに表示する最大譜面数。 */
export const PLAYER_STATS_CANDIDATE_LIMIT = 5

/** ヒートマップ背景色へ混ぜるアクセント色の最大割合。 */
export const PLAYER_STATS_HEATMAP_MAX_MIX_PERCENT = 55

/** レベル別達成率の列定義。 */
export const PLAYER_STATS_LEVEL_METRICS: Record<
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

import { CHART_COPY } from '../../constants/chart'
import { localizedCopy } from '../../i18n'
import type { PlayerDataDifficulty } from '../../types/api'
import {
  RANDOM_SONG_OP_TARGET_FILTER,
  type RandomSongDifficultyFilter,
} from '../../utils/randomSongSelector'

/** ランダム選曲の表示文言 */
const RANDOM_SONG_SELECTOR_TEXT = localizedCopy('tools.randomSongSelector')

/**
 * ランダム選曲結果を保存する sessionStorage キー。
 */
export const RANDOM_SONG_RESULTS_STORAGE_KEY = 'chunisupport:random-song-selector:results'

/**
 * ランダム選曲ツールの初期値。
 */
export const RANDOM_SONG_SELECTOR_DEFAULTS = {
  count: '3',
  minConst: '',
  maxConst: '',
  minScore: '',
  maxScore: '',
  defaultWeight: '1',
  showRecord: true,
  favoriteOnly: false,
} as const

/**
 * ランダム選曲ツールの初期選択難易度。
 */
export const RANDOM_SONG_SELECTOR_DEFAULT_DIFFICULTIES: PlayerDataDifficulty[] = [
  'MASTER',
  'ULTIMA',
]

/**
 * ランダム選曲ツールの難易度絞り込み表示名。
 */
export const RANDOM_SONG_SELECTOR_DIFFICULTY_FILTER_LABELS = {
  BASIC: 'BASIC',
  ADVANCED: 'ADVANCED',
  EXPERT: 'EXPERT',
  MASTER: 'MASTER',
  ULTIMA: 'ULTIMA',
  [RANDOM_SONG_OP_TARGET_FILTER]: CHART_COPY.opTarget,
} satisfies Record<RandomSongDifficultyFilter, string>

/**
 * ランダム選曲ツールで使う短い入力項目ラベル。
 */
export const RANDOM_SONG_SELECTOR_FIELD_LABELS = localizedCopy(
  'tools.randomSongSelector.randomSongSelectorFieldLabels'
)

/**
 * ランダム選曲ツールの表示文言。タイトルと説明文はツール一覧の定義を参照すること。
 */
export const RANDOM_SONG_SELECTOR_COPY = {
  goalFilterLabel: RANDOM_SONG_SELECTOR_TEXT.goalFilterLabel,
  goalFilterDialogTitle: RANDOM_SONG_SELECTOR_TEXT.goalFilterDialogTitle,
  goalFilterNoneLabel: RANDOM_SONG_SELECTOR_TEXT.goalFilterNoneLabel,
  goalFilterCancelLabel: RANDOM_SONG_SELECTOR_TEXT.goalFilterCancelLabel,
  goalFilterApplyLabel: RANDOM_SONG_SELECTOR_TEXT.goalFilterApplyLabel,
  goalFilterUnavailableMessage: RANDOM_SONG_SELECTOR_TEXT.goalFilterUnavailableMessage,
  goalFilterFetchErrorMessage: RANDOM_SONG_SELECTOR_TEXT.goalFilterFetchErrorMessage,
  goalFilterRecordFetchErrorMessage: RANDOM_SONG_SELECTOR_TEXT.goalFilterRecordFetchErrorMessage,
  goalFilterEmptyMessage: RANDOM_SONG_SELECTOR_TEXT.goalFilterEmptyMessage,
  countLabel: RANDOM_SONG_SELECTOR_TEXT.countLabel,
  difficultyLabel: RANDOM_SONG_SELECTOR_TEXT.difficultyLabel,
  favoriteOnlyLabel: RANDOM_SONG_SELECTOR_TEXT.favoriteOnlyLabel,
  genreLabel: RANDOM_SONG_SELECTOR_TEXT.genreLabel,
  versionLabel: RANDOM_SONG_SELECTOR_TEXT.versionLabel,
  minConstLabel: RANDOM_SONG_SELECTOR_TEXT.minConstLabel,
  maxConstLabel: RANDOM_SONG_SELECTOR_TEXT.maxConstLabel,
  advancedSettingsLabel: RANDOM_SONG_SELECTOR_TEXT.advancedSettingsLabel,
  recordFilterSettingsLabel: RANDOM_SONG_SELECTOR_TEXT.recordFilterSettingsLabel,
  drawRateLabel: RANDOM_SONG_SELECTOR_FIELD_LABELS.drawRate,
  drawRatePercentLabel: RANDOM_SONG_SELECTOR_TEXT.drawRatePercentLabel,
  invalidDrawRatePercentLabel: '-',
  mixedWeightPlaceholder: RANDOM_SONG_SELECTOR_TEXT.mixedWeightPlaceholder,
  difficultyWeightLabel: RANDOM_SONG_SELECTOR_TEXT.difficultyWeightLabel,
  levelWeightLabel: RANDOM_SONG_SELECTOR_TEXT.levelWeightLabel,
  constWeightLabel: RANDOM_SONG_SELECTOR_TEXT.constWeightLabel,
  recordVisibleLabel: RANDOM_SONG_SELECTOR_TEXT.recordVisibleLabel,
  playStatusLabel: RANDOM_SONG_SELECTOR_TEXT.playStatusLabel,
  lampLabel: RANDOM_SONG_SELECTOR_TEXT.lampLabel,
  minScoreLabel: RANDOM_SONG_SELECTOR_TEXT.minScoreLabel,
  maxScoreLabel: RANDOM_SONG_SELECTOR_TEXT.maxScoreLabel,
  bestFrameLabel: RANDOM_SONG_SELECTOR_TEXT.bestFrameLabel,
  recordUnavailableMessage: RANDOM_SONG_SELECTOR_TEXT.recordUnavailableMessage,
  recordFetchErrorMessage: RANDOM_SONG_SELECTOR_TEXT.recordFetchErrorMessage,
  favoriteFetchErrorMessage: RANDOM_SONG_SELECTOR_TEXT.favoriteFetchErrorMessage,
  drawButtonLabel: RANDOM_SONG_SELECTOR_TEXT.drawButtonLabel,
  resetButtonLabel: RANDOM_SONG_SELECTOR_TEXT.resetButtonLabel,
  resetConfirmTitle: RANDOM_SONG_SELECTOR_TEXT.resetConfirmTitle,
  resetConfirmDescription: RANDOM_SONG_SELECTOR_TEXT.resetConfirmDescription,
  resetCancelLabel: RANDOM_SONG_SELECTOR_TEXT.resetCancelLabel,
  resetConfirmLabel: RANDOM_SONG_SELECTOR_TEXT.resetConfirmLabel,
  closeButtonLabel: RANDOM_SONG_SELECTOR_TEXT.closeButtonLabel,
  resultLabel: RANDOM_SONG_SELECTOR_TEXT.resultLabel,
  candidateCountLabel: RANDOM_SONG_SELECTOR_TEXT.candidateCountLabel,
  noCandidatesMessage: RANDOM_SONG_SELECTOR_TEXT.noCandidatesMessage,
  noResultsMessage: RANDOM_SONG_SELECTOR_TEXT.noResultsMessage,
  invalidCountMessage: RANDOM_SONG_SELECTOR_TEXT.invalidCountMessage,
  invalidConstRangeMessage: RANDOM_SONG_SELECTOR_TEXT.invalidConstRangeMessage,
  invalidScoreRangeMessage: RANDOM_SONG_SELECTOR_TEXT.invalidScoreRangeMessage,
  invalidWeightMessage: RANDOM_SONG_SELECTOR_TEXT.invalidWeightMessage,
} as const

/**
 * プレイ状況フィルターの選択肢。
 */
export const RANDOM_SONG_PLAY_STATUS_OPTIONS = [
  { value: 'all', label: RANDOM_SONG_SELECTOR_TEXT.allLabel },
  { value: 'played', label: RANDOM_SONG_SELECTOR_TEXT.playedLabel },
  { value: 'unplayed', label: RANDOM_SONG_SELECTOR_TEXT.unplayedLabel },
] as const

/**
 * ベスト枠フィルターの選択肢。
 */
export const RANDOM_SONG_BEST_FRAME_OPTIONS = [
  { value: 'all', label: RANDOM_SONG_SELECTOR_TEXT.allLabel },
  { value: 'only', label: RANDOM_SONG_SELECTOR_TEXT.onlyLabel },
  { value: 'exclude', label: RANDOM_SONG_SELECTOR_TEXT.excludeLabel },
] as const

/**
 * ランダム選曲ツールのランプフィルター選択肢。
 */
export const RANDOM_SONG_LAMP_OPTIONS = [
  { value: 'AJC', label: 'AJC' },
  { value: 'AJ', label: 'AJ' },
  { value: 'FC', label: 'FC' },
  { value: 'CATASTROPHY', label: 'CATASTROPHY' },
  { value: 'ABSOLUTE', label: 'ABSOLUTE' },
  { value: 'BRAVE', label: 'BRAVE' },
  { value: 'HARD', label: 'HARD' },
  { value: 'CLEAR', label: 'CLEAR' },
  { value: 'FAILED', label: 'FAILED' },
  { value: 'NONE', label: RANDOM_SONG_SELECTOR_TEXT.noneLabel },
] as const

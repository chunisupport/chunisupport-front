import {
  HARD_LAMP_BADGE_BACKGROUND_CLASS,
  type SharedClearLamp,
  type SharedComboLamp,
} from '../../components/common/record/recordStyleClasses'
import {
  DIFFICULTY_SHORT_NAME_MAP,
  normalizePlayerDataDifficulty,
} from '../../constants/difficulty'
import type {
  PlayerDataCourseRecordState,
  PlayerDataRecordChange,
  PlayerDataRecordState,
  PlayerDataSongRecordChange,
  PlayerDataStatisticsDifficulty,
} from '../../types/api'
import { difficultyBadgeClass } from '../../utils/difficultyUtils'
import { formatLocalDateTime } from '../../utils/localDateTime'
import { formatInteger } from '../../utils/numberFormat'
import { formatPlayerRating } from '../../utils/ratingFormat'
import {
  type REGISTER_SCORE_STAT_COLUMNS,
  REGISTER_SCORE_STATISTIC_DIVIDER_START_COLUMN,
} from './registerScoreStatistics'

export { courseClassBadgeClass, formatCourseClass } from '../../utils/courseClassDisplay'

/** 楽曲またはコース名を解決できない場合の表示名 */
export const REGISTER_SCORE_UNKNOWN_TITLE = '-'

/** 更新前スコアや集計値など、値がない項目に表示するプレースホルダー */
export const REGISTER_SCORE_NO_DATA_TEXT = '-'

/** WORLD'S END譜面の難易度短縮表記 */
const REGISTER_SCORE_WORLDSEND_DIFFICULTY_LABEL = 'WE'

/** WORLD'S END譜面の難易度バッジへ適用するクラス */
const REGISTER_SCORE_WORLDSEND_BADGE_CLASS =
  'bg-[image:var(--cs-color-worldsend-label-bg)] text-worldsend-label-text'

/** 集計行の難易度ラベルへ適用するゲーム公式色の文字色クラス */
const REGISTER_SCORE_STATISTIC_DIFFICULTY_TEXT_CLASS: Readonly<
  Record<PlayerDataStatisticsDifficulty, string>
> = {
  BASIC: 'text-[var(--cs-color-difficulty-basic-bg)]',
  ADVANCED: 'text-[var(--cs-color-difficulty-advanced-bg)]',
  EXPERT: 'text-[var(--cs-color-difficulty-expert-bg)]',
  MASTER: 'text-[var(--cs-color-difficulty-master-bg)]',
  ULTIMA: 'text-[var(--cs-color-difficulty-ultima-bg)]',
  WE: 'text-[var(--cs-color-worldsend-label-bg)]',
}

/** 更新差分カードで表示対応しているフルチェインランプ */
type RegisterScoreFullChain = 'FULL CHAIN GOLD' | 'FULL CHAIN PLATINUM'

/** レコードページ共通のランプ表示部品へ渡す更新差分のランプ情報 */
export type RegisterScoreLampRecord = {
  is_played: boolean
  score: number
  clear_lamp: SharedClearLamp
  combo_lamp: SharedComboLamp
  full_chain: RegisterScoreFullChain | null
}

/**
 * レーティングが存在する場合だけ表示用文字列へ変換する。
 *
 * @param value - APIから返却されたレーティング。
 * @returns レーティング表示文字列。値がない場合はプレースホルダー。
 */
export const formatRegisterScoreNullableRating = (value: number | null): string =>
  value === null ? REGISTER_SCORE_NO_DATA_TEXT : formatPlayerRating(value)

/**
 * 集計値の差分を符号付き表示へ変換する。
 *
 * @param delta - 表示対象の差分値。
 * @returns 正数にはプラス記号を付けた3桁区切りの差分文字列。
 */
export const formatRegisterScoreStatisticDelta = (delta: number): string =>
  delta > 0 ? `+${formatInteger(delta)}` : formatInteger(delta)

/**
 * TOTAL HIGH SCOREの差分文字色を返す。
 *
 * @param delta - 表示対象の差分値。
 * @returns プラスの場合はNEW RECORDSと同じ青、それ以外は通常文字色のクラス。
 */
export const getRegisterScoreTotalHighScoreDeltaClass = (delta: number): string =>
  delta > 0 ? 'text-blue-700' : 'text-text'

/**
 * 更新差分がスコア更新を含む場合に増分を表示する。
 *
 * @param change - APIから返却された1譜面または1コース分の差分。
 * @returns スコア増分の表示文字列。新規登録やスコア上昇なしの場合は空文字。
 */
export const formatRegisterScoreChangeDelta = (change: PlayerDataRecordChange): string => {
  if (!change.before) return ''

  const delta = change.after.score - change.before.score
  if (delta <= 0) return ''

  return `+${formatInteger(delta)}`
}

/**
 * ISO日時を更新差分レポートの表示用日時文字列へ変換する。
 *
 * @param isoDateTime - APIから返却されたISO形式の日時。
 * @returns `YYYY/MM/DD HH:mm:ss` 形式のローカル日時文字列。
 */
export const formatRegisterScoreImportedAt = (isoDateTime: string): string =>
  formatLocalDateTime(new Date(isoDateTime))

/**
 * 楽曲差分の難易度を短縮表記へ変換する。
 *
 * @param change - APIから返却された1譜面分の差分。
 * @returns 難易度の短縮表記。通常譜面の難易度として解釈できない値はプレースホルダー。
 */
export const getRegisterScoreShortDifficultyLabel = (
  change: PlayerDataSongRecordChange
): string => {
  if (change.record_type === 'worldsend') return REGISTER_SCORE_WORLDSEND_DIFFICULTY_LABEL

  const difficulty = normalizePlayerDataDifficulty(change.diff)
  return difficulty ? DIFFICULTY_SHORT_NAME_MAP[difficulty] : REGISTER_SCORE_NO_DATA_TEXT
}

/**
 * 楽曲差分の難易度バッジに適用するクラスを返す。
 *
 * @param change - APIから返却された1譜面分の差分。
 * @returns 背景色・文字色のTailwindクラス。
 */
export const getRegisterScoreDifficultyBadgeClass = (change: PlayerDataSongRecordChange): string =>
  change.record_type === 'worldsend'
    ? REGISTER_SCORE_WORLDSEND_BADGE_CLASS
    : difficultyBadgeClass(change.diff)

/**
 * 集計行の難易度ラベルへゲーム公式色の文字色クラスを適用する。
 *
 * @param difficulty - 表示対象の難易度。全体行の場合はnull。
 * @returns 難易度色のTailwindクラス。全体行や未対応の値の場合は空文字。
 */
export const getRegisterScoreStatisticDifficultyTextClass = (
  difficulty: PlayerDataStatisticsDifficulty | null
): string => (difficulty ? (REGISTER_SCORE_STATISTIC_DIFFICULTY_TEXT_CLASS[difficulty] ?? '') : '')

/**
 * RECORD STATISTICSの列に適用する区切り線クラスを返す。
 *
 * @param column - 表示対象の統計列。
 * @returns FC列の直後へ区切り線を描画するTailwindクラス。対象外なら空文字。
 */
export const getRegisterScoreStatisticColumnDividerClass = (
  column: (typeof REGISTER_SCORE_STAT_COLUMNS)[number]
): string =>
  column === REGISTER_SCORE_STATISTIC_DIVIDER_START_COLUMN ? 'border-l border-border' : ''

/**
 * API由来のランプ文字列を大文字のドメイン値へ正規化する。
 *
 * @param value - APIから返却されたランプ名。
 * @returns 大文字へ正規化したランプ名。値がない場合はnull。
 */
export const normalizeRegisterScoreLamp = (value: string | null): string | null =>
  value?.toUpperCase() ?? null

/**
 * 文字列が表示対応済みのクリアランプか判定する。
 *
 * @param value - 大文字へ正規化済みのランプ名。
 * @returns クリアランプとして扱える場合はtrue。
 */
const isSharedClearLamp = (value: string): value is NonNullable<SharedClearLamp> =>
  value in HARD_LAMP_BADGE_BACKGROUND_CLASS

/**
 * 文字列が表示対応済みのコンボランプか判定する。
 *
 * @param value - 大文字へ正規化済みのランプ名。
 * @returns コンボランプとして扱える場合はtrue。
 */
const isSharedComboLamp = (value: string): value is NonNullable<SharedComboLamp> =>
  value === 'FULL COMBO' || value === 'ALL JUSTICE'

/**
 * 文字列が表示対応済みのフルチェインランプか判定する。
 *
 * @param value - 大文字へ正規化済みのランプ名。
 * @returns フルチェインランプとして扱える場合はtrue。
 */
const isRegisterScoreFullChain = (value: string): value is RegisterScoreFullChain =>
  value === 'FULL CHAIN GOLD' || value === 'FULL CHAIN PLATINUM'

/**
 * API由来のコンボランプを表示対応済みの値へ変換する。
 *
 * @param value - APIから返却されたコンボランプ名。
 * @returns 表示対応済みのコンボランプ。対応しない値や未設定の場合はnull。
 */
const toRegisterScoreComboLamp = (value: string | null): SharedComboLamp => {
  const comboLamp = normalizeRegisterScoreLamp(value)
  return comboLamp && isSharedComboLamp(comboLamp) ? comboLamp : null
}

/**
 * 楽曲のレコード状態をレコードページ共通のランプ表示部品へ渡せる形に変換する。
 *
 * @param state - APIから返却された1譜面分のレコード状態。
 * @returns 表示対応済みのランプだけを持つランプ用レコード。
 */
export const toRegisterScoreLampRecord = (
  state: PlayerDataRecordState
): RegisterScoreLampRecord => {
  const clearLamp = normalizeRegisterScoreLamp(state.clear_lamp)
  const fullChain = normalizeRegisterScoreLamp(state.full_chain)

  return {
    is_played: true,
    score: state.score,
    clear_lamp: clearLamp && isSharedClearLamp(clearLamp) ? clearLamp : null,
    combo_lamp: toRegisterScoreComboLamp(state.combo_lamp),
    full_chain: fullChain && isRegisterScoreFullChain(fullChain) ? fullChain : null,
  }
}

/**
 * コースのレコード状態を、CLEAR状態とコンボランプだけを持つランプ用レコードへ変換する。
 *
 * @param state - APIから返却された1コース分のレコード状態。
 * @returns クリア済みならCLEARを持ち、フルチェインを持たないランプ用レコード。
 */
export const toRegisterScoreCourseLampRecord = (
  state: PlayerDataCourseRecordState
): RegisterScoreLampRecord => ({
  is_played: true,
  score: state.score,
  clear_lamp: state.is_clear ? 'CLEAR' : null,
  combo_lamp: toRegisterScoreComboLamp(state.combo_lamp),
  full_chain: null,
})

/**
 * WORLD'S ENDの星数レベルをレポート表示用の文字列へ変換する。
 *
 * @param levelStar - WORLD'S END譜面の星数レベル。
 * @returns 星を付けたレベル。未設定の場合はundefined。
 */
export const formatWorldsendChartLevel = (
  levelStar: number | null | undefined
): string | undefined =>
  levelStar === null || levelStar === undefined ? undefined : `★${levelStar}`

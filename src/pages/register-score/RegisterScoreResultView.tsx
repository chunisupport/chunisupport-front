import { Download, Play } from 'lucide-solid'
import { createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import logoSingle from '../../assets/logo_single.svg'
import { Loading } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import { CheckboxField } from '../../components/common/CheckboxField'
import { LampPlaceholderBadge } from '../../components/common/record/RecordBadges'
import {
  RecordFullChainCell,
  RecordHardLampCell,
  RecordLampCell,
} from '../../components/common/record/RecordDisplayParts'
import {
  HARD_LAMP_BADGE_BACKGROUND_CLASS,
  type SharedClearLamp,
  type SharedComboLamp,
} from '../../components/common/record/recordStyleClasses'
import type {
  PlayerDataCourseRecordChange,
  PlayerDataCourseRecordState,
  PlayerDataDifficulty,
  PlayerDataRecordChange,
  PlayerDataRecordState,
  PlayerDataSongRecordChange,
  PlayerDataUpdateResult,
} from '../../types/api'
import { difficultyBadgeClass } from '../../utils/difficultyUtils'
import { formatOverPowerPercent, formatOverPowerValue } from '../../utils/overPowerFormat'
import { formatPlayerRating } from '../../utils/ratingFormat'
import {
  courseClassBadgeClass,
  formatCourseClass,
  REGISTER_SCORE_UNKNOWN_TITLE,
} from './registerScoreDisplay'
import {
  createDefaultRegisterScoreStatisticRowVisibility,
  createDefaultRegisterScoreTotalHighScoreRowVisibility,
  REGISTER_SCORE_AGGREGATE_ROW_OPTIONS,
  REGISTER_SCORE_STAT_COLUMNS,
  REGISTER_SCORE_STATISTIC_DIVIDER_START_COLUMN,
  type RegisterScoreAggregateRowKey,
  type RegisterScoreAggregateRowVisibility,
  type RegisterScoreStatisticRow,
  toRegisterScoreStatisticRows,
  toRegisterScoreTotalHighScoreRows,
} from './registerScoreStatistics'

export const REGISTER_SCORE_MESSAGES = {
  invalidToken: 'tokenが不正です。登録用URLを確認してください。',
  fallbackError: '登録に失敗しました。',
  reportTitle: '更新差分',
  title: 'スコア登録',
  processing: 'スコアデータを登録しています。',
  changedSongsTitle: 'NEW RECORDS',
  changedSongsEmpty: '今回更新された楽曲はありません。',
  changedCoursesTitle: 'COURSE RECORDS',
  totalHighScoreTitle: 'TOTAL HIGH SCORE',
  recordStatsTitle: 'RECORD STATISTICS',
  displaySettingsTitle: '表示設定',
  downloadImage: '画像をダウンロード',
  downloadingImage: '画像を作成中',
  downloadImageError: '画像のダウンロードに失敗しました。',
  unknownSongTitle: REGISTER_SCORE_UNKNOWN_TITLE,
} as const

const NO_DATA_TEXT = '-'
const WORLD_END_BADGE_CLASS =
  'bg-[image:var(--cs-color-worldsend-label-bg)] text-worldsend-label-text'
const PROFILE_VALUE_CLASS = 'font-jost text-base font-normal leading-6'
/** 更新差分レポートの原寸幅を固定するクラス。 */
const REGISTER_SCORE_REPORT_WIDTH_CLASS = 'w-[31rem]'
/** 更新差分レポートの表示領域を原寸幅以下に制限するクラス。 */
const REGISTER_SCORE_REPORT_MAX_WIDTH_CLASS = 'max-w-[31rem]'
/** 更新差分レポートヘッダに表示するロゴの色。 */
const REGISTER_SCORE_REPORT_LOGO_COLOR = '#444444'
/** 更新差分画像を原寸の2倍で出力するピクセル比。 */
const REGISTER_SCORE_IMAGE_PIXEL_RATIO = 2
/** 2倍出力時もCanvasの一辺を16,000px以内へ収めるレポート寸法。 */
const REGISTER_SCORE_IMAGE_MAX_CSS_SIDE = 8_000
/** ダウンロード開始後にObject URLを解放するまでの待機時間。 */
const REGISTER_SCORE_IMAGE_OBJECT_URL_REVOKE_DELAY_MS = 1_000
/** 更新差分画像のファイル名へ付与する接頭辞。 */
const REGISTER_SCORE_IMAGE_FILENAME_PREFIX = 'chunisupport-score-update'

/**
 * 難易度バッジを固定幅で中央揃えにする共通レイアウトクラス。
 */
const DIFFICULTY_BADGE_LAYOUT_CLASS =
  'inline-flex w-10 shrink-0 items-center justify-center rounded px-0 py-0.5 text-xs font-bold leading-5'

/**
 * 更新差分カードの外枠に適用する共通クラス。
 */
const SCORE_CHANGE_CARD_CLASS =
  'min-w-0 max-w-full rounded-md border border-border bg-surface-muted px-2.5 py-2'

/**
 * 更新前後のスコア領域を等間隔に並べる共通クラス。
 */
const SCORE_CHANGE_SCORE_GRID_CLASS =
  'mt-1.5 flex items-center justify-around gap-x-2 text-lg leading-6'
/** コース差分のスコアとランプ表示領域を固定幅にするクラス。 */
const COURSE_CHANGE_SCORE_VALUE_CLASS = 'w-[95px] shrink-0'
/** コースクラスバッジの共通レイアウトクラス。 */
const COURSE_CLASS_BADGE_LAYOUT_CLASS =
  'inline-flex min-w-6 shrink-0 items-center justify-center rounded font-sans text-xs font-bold uppercase leading-5 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]'

type RegisterScoreLampRecord = {
  is_played: boolean
  score: number
  clear_lamp: SharedClearLamp
  combo_lamp: SharedComboLamp
  full_chain: 'FULL CHAIN GOLD' | 'FULL CHAIN PLATINUM' | null
}

export type RegisterScoreSongTitleResolver = (change: PlayerDataRecordChange) => string
export type RegisterScoreChartLevelResolver = (change: PlayerDataRecordChange) => string | undefined
/** コース差分からコースタイトルを解決する関数。 */
export type RegisterScoreCourseTitleResolver = (change: PlayerDataCourseRecordChange) => string

/**
 * RECORD STATISTICSの列に適用する区切り線クラスを返す。
 *
 * @param column - 表示対象の統計列。
 * @returns FC列の直後へ区切り線を描画するTailwindクラス。対象外なら空文字。
 */
const getRegisterScoreStatisticColumnDividerClass = (
  column: (typeof REGISTER_SCORE_STAT_COLUMNS)[number]
): string =>
  column === REGISTER_SCORE_STATISTIC_DIVIDER_START_COLUMN ? 'border-l border-border' : ''

/**
 * 難易度ラベルへゲーム公式色の文字色クラスを適用する。
 *
 * @param difficulty - 表示対象の難易度。全体行の場合はnull。
 * @returns 難易度色のTailwindクラス。全体行の場合は空文字。
 */
const getDifficultyTextClass = (difficulty: PlayerDataDifficulty | null): string => {
  switch (difficulty) {
    case 'BASIC':
      return 'text-[var(--cs-color-difficulty-basic-bg)]'
    case 'ADVANCED':
      return 'text-[var(--cs-color-difficulty-advanced-bg)]'
    case 'EXPERT':
      return 'text-[var(--cs-color-difficulty-expert-bg)]'
    case 'MASTER':
      return 'text-[var(--cs-color-difficulty-master-bg)]'
    case 'ULTIMA':
      return 'text-[var(--cs-color-difficulty-ultima-bg)]'
    default:
      return ''
  }
}

/**
 * 文字列が表示対応済みのクリアランプか判定する。
 *
 * @param value - 判定対象の文字列。
 * @returns クリアランプとして扱える場合はtrue。
 */
const isSharedClearLamp = (value: string): value is NonNullable<SharedClearLamp> => {
  return value in HARD_LAMP_BADGE_BACKGROUND_CLASS
}

/**
 * 文字列が表示対応済みのコンボランプか判定する。
 *
 * @param value - 判定対象の文字列。
 * @returns コンボランプとして扱える場合はtrue。
 */
const isSharedComboLamp = (value: string): value is NonNullable<SharedComboLamp> => {
  return value === 'FULL COMBO' || value === 'ALL JUSTICE'
}

/**
 * 文字列が表示対応済みのフルチェインランプか判定する。
 *
 * @param value - 判定対象の文字列。
 * @returns フルチェインランプとして扱える場合はtrue。
 */
const isRegisterScoreFullChain = (
  value: string
): value is NonNullable<RegisterScoreLampRecord['full_chain']> => {
  return value === 'FULL CHAIN GOLD' || value === 'FULL CHAIN PLATINUM'
}

/**
 * 数値をスコア表示用の3桁区切り文字列へ変換する。
 *
 * @param score - 表示対象のスコア。
 * @returns 日本語ロケールのスコア文字列。
 */
const formatScore = (score: number): string => {
  return score.toLocaleString('ja-JP')
}

/**
 * レーティングが存在する場合だけ表示用文字列へ変換する。
 *
 * @param value - APIから返却されたレーティング。
 * @returns レーティング表示文字列。値がない場合はプレースホルダー。
 */
const formatNullableRating = (value: number | null): string => {
  return value === null ? NO_DATA_TEXT : formatPlayerRating(value)
}

/**
 * 差分値を符号付き表示へ変換する。
 *
 * @param delta - 表示対象の差分値。
 * @returns 正数にはプラス記号を付けた差分文字列。
 */
const formatStatisticDelta = (delta: number): string =>
  delta > 0 ? `+${formatScore(delta)}` : formatScore(delta)

/**
 * TOTAL HIGH SCOREの差分文字色を返す。
 *
 * @param delta - 表示対象の差分値。
 * @returns プラスの場合はNEW RECORDSと同じ青、それ以外は通常文字色。
 */
const getTotalHighScoreDeltaClass = (delta: number): string =>
  delta > 0 ? 'text-blue-700' : 'text-text'

/**
 * 差分がスコア更新を含む場合に増分を表示する。
 *
 * @param change - APIから返却された1譜面分の差分。
 * @returns スコア増分の表示文字列。新規登録やスコア変化なしの場合は空文字。
 */
const formatScoreDelta = (change: PlayerDataRecordChange): string => {
  if (!change.before) return ''

  const delta = change.after.score - change.before.score
  if (delta <= 0) return ''

  return `+${formatScore(delta)}`
}

/**
 * ISO日時を画面表示用の日時文字列へ変換する。
 *
 * @param isoDateTime - APIから返却されたISO形式の日時。
 * @returns `YYYY/MM/DD HH:mm:ss` 形式の日時文字列。
 */
const formatImportedAt = (isoDateTime: string): string => {
  const date = new Date(isoDateTime)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 更新日時からPNG画像のダウンロードファイル名を生成する。
 *
 * @param isoDateTime - APIから返却されたISO形式の更新日時。
 * @returns `chunisupport-score-update-YYYYMMDD-HHmmss.png` 形式のファイル名。
 */
const formatRegisterScoreImageFilename = (isoDateTime: string): string => {
  const timestamp = formatImportedAt(isoDateTime)
    .replaceAll('/', '')
    .replaceAll(':', '')
    .replace(' ', '-')

  return `${REGISTER_SCORE_IMAGE_FILENAME_PREFIX}-${timestamp}.png`
}

/**
 * 画像化対象を祖先の表示用transformから切り離し、Canvas上限内の寸法で複製する。
 *
 * @param reportElement - 画面に表示中の更新差分レポート。
 * @returns 画像化対象の複製と破棄処理。
 */
const createRegisterScoreImageCapture = (
  reportElement: HTMLElement
): { element: HTMLDivElement; dispose: () => void } => {
  const reportWidth = reportElement.offsetWidth
  const reportHeight = reportElement.offsetHeight
  const captureScale = Math.min(
    1,
    REGISTER_SCORE_IMAGE_MAX_CSS_SIDE / reportWidth,
    REGISTER_SCORE_IMAGE_MAX_CSS_SIDE / reportHeight
  )
  const captureHost = document.createElement('div')
  const captureElement = document.createElement('div')
  const reportClone = reportElement.cloneNode(true) as HTMLElement

  Object.assign(captureHost.style, {
    left: '-100000px',
    pointerEvents: 'none',
    position: 'fixed',
    top: '0',
  })
  Object.assign(captureElement.style, {
    height: `${Math.ceil(reportHeight * captureScale)}px`,
    overflow: 'hidden',
    width: `${Math.ceil(reportWidth * captureScale)}px`,
  })
  Object.assign(reportClone.style, {
    maxWidth: 'none',
    transform: `scale(${captureScale})`,
    transformOrigin: 'top left',
    width: `${reportWidth}px`,
  })
  captureHost.setAttribute('aria-hidden', 'true')
  captureElement.appendChild(reportClone)
  captureHost.appendChild(captureElement)
  document.body.appendChild(captureHost)

  return {
    element: captureElement,
    dispose: () => captureHost.remove(),
  }
}

/**
 * Blobを指定ファイル名でダウンロードする。
 *
 * @param blob - ダウンロードするファイル内容。
 * @param filename - ダウンロード時に使用する拡張子付きファイル名。
 * @returns なし。
 */
const downloadRegisterScoreFile = (blob: Blob, filename: string): void => {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = objectUrl
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(
    () => URL.revokeObjectURL(objectUrl),
    REGISTER_SCORE_IMAGE_OBJECT_URL_REVOKE_DELAY_MS
  )
}

/**
 * 難易度を短縮表記へ変換する。
 *
 * @param change - APIから返却された1譜面分の差分。
 * @returns 難易度の短縮表記。
 */
const getShortDifficultyLabel = (change: PlayerDataSongRecordChange): string => {
  if (change.record_type === 'worldsend') return 'WE'

  switch (change.diff) {
    case 'BASIC':
      return 'BAS'
    case 'ADVANCED':
      return 'ADV'
    case 'EXPERT':
      return 'EXP'
    case 'MASTER':
      return 'MAS'
    case 'ULTIMA':
      return 'ULT'
    default:
      return NO_DATA_TEXT
  }
}

/**
 * 難易度バッジに適用するクラスを返す。
 *
 * @param change - APIから返却された1譜面分の差分。
 * @returns Tailwindの背景色・文字色クラス。
 */
const getDifficultyBadgeClass = (change: PlayerDataSongRecordChange): string => {
  if (change.record_type === 'worldsend') return WORLD_END_BADGE_CLASS

  return difficultyBadgeClass(change.diff)
}

/**
 * API由来のランプ文字列を大文字のドメイン値へ正規化する。
 *
 * @param value - APIから返却されたランプ名。
 * @returns 大文字へ正規化したランプ名。値がない場合はnull。
 */
const normalizeLamp = (value: string | null): string | null => value?.toUpperCase() ?? null

/**
 * API由来のレコード状態をレコードページ共通のランプ表示部品へ渡せる形に変換する。
 *
 * @param state - APIから返却された1譜面分のレコード状態。
 * @returns レコードページ共通セルで表示できるランプ用レコード。
 */
const toRegisterScoreLampRecord = (state: PlayerDataRecordState): RegisterScoreLampRecord => {
  const clearLamp = normalizeLamp(state.clear_lamp)
  const comboLamp = normalizeLamp(state.combo_lamp)
  const fullChain = normalizeLamp(state.full_chain)

  return {
    is_played: true,
    score: state.score,
    clear_lamp: clearLamp && isSharedClearLamp(clearLamp) ? clearLamp : null,
    combo_lamp: comboLamp && isSharedComboLamp(comboLamp) ? comboLamp : null,
    full_chain: fullChain && isRegisterScoreFullChain(fullChain) ? fullChain : null,
  }
}

/**
 * レコードページ共通のランプ表示を使って、レコード状態に含まれるランプを表示する。
 *
 * @param props - 表示対象のレコード状態。
 * @returns ランプバッジ群。
 */
const RecordLampBadges = (props: { state: PlayerDataRecordState }) => {
  const record = createMemo(() => toRegisterScoreLampRecord(props.state))

  return (
    <div class="mt-1 flex min-h-6 flex-wrap items-center gap-1">
      <RecordHardLampCell record={record()} />
      <RecordLampCell record={record()} />
      <RecordFullChainCell record={record()} />
    </div>
  )
}

/**
 * コースレコードのCLEAR状態とコンボランプだけを表示する。
 *
 * @param props - 表示対象のコースレコード状態。
 * @returns コース用ランプバッジ群。
 */
const CourseRecordLampBadges = (props: { state: PlayerDataCourseRecordState }) => {
  const record = createMemo<RegisterScoreLampRecord>(() => {
    const comboLamp = normalizeLamp(props.state.combo_lamp)

    return {
      is_played: true,
      score: props.state.score,
      clear_lamp: props.state.is_clear ? 'CLEAR' : null,
      combo_lamp: comboLamp && isSharedComboLamp(comboLamp) ? comboLamp : null,
      full_chain: null,
    }
  })

  return (
    <div class="mt-1 flex min-h-6 flex-wrap items-center gap-1">
      <RecordHardLampCell record={record()} />
      <RecordLampCell record={record()} />
    </div>
  )
}

/**
 * プレイヤー概要をレポート形式で表示する。
 *
 * @param props - APIから返却された登録結果。
 * @returns プロフィール概要。
 */
const RegisterScoreProfileSummary = (props: { result: PlayerDataUpdateResult }) => (
  <section class="pb-3">
    <div class="flex items-center gap-2 border-b border-border bg-surface-muted px-3 py-2.5">
      <p class="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 font-sans text-xl font-extrabold leading-none">
        <span class="shrink-0 whitespace-nowrap tracking-normal">
          Lv. {props.result.profile.level}
        </span>
        <span class="min-w-0 truncate text-center">{props.result.profile.name}</span>
      </p>
    </div>
    <dl class="grid grid-cols-[7rem_1fr] gap-x-3 px-5 pt-2 text-base leading-6">
      <dt class="font-extrabold text-text-muted">RATING</dt>
      <dd class={PROFILE_VALUE_CLASS}>{formatNullableRating(props.result.summary.rating)}</dd>
      <dt class="font-extrabold text-text-muted">OVER POWER</dt>
      <dd class={PROFILE_VALUE_CLASS}>
        <Show
          when={
            props.result.summary.overpower_value !== null &&
            props.result.summary.overpower_percentage !== null
          }
          fallback={NO_DATA_TEXT}
        >
          {formatOverPowerValue(props.result.summary.overpower_value ?? 0)} (
          {formatOverPowerPercent(props.result.summary.overpower_percentage ?? 0)}%)
        </Show>
      </dd>
    </dl>
  </section>
)

/**
 * 集計セクションと行ごとの表示設定を共通レイアウトで表示する。
 *
 * @param props - セクション名、表示状態、および変更ハンドラー。
 * @returns 集計セクション用の表示設定。
 */
const RegisterScoreAggregateVisibilitySettings = (props: {
  label: string
  checked: boolean
  rowVisibility: RegisterScoreAggregateRowVisibility
  onChange: (checked: boolean) => void
  onRowVisibilityChange: (key: RegisterScoreAggregateRowKey, checked: boolean) => void
}) => (
  <div class="flex flex-col items-start gap-2">
    <CheckboxField
      checked={props.checked}
      onChange={props.onChange}
      textVariant="large"
      label={props.label}
    />
    <div class="ml-7 flex flex-col items-start gap-2">
      <For each={REGISTER_SCORE_AGGREGATE_ROW_OPTIONS}>
        {(option) => (
          <CheckboxField
            checked={props.rowVisibility[option.key]}
            disabled={!props.checked}
            onChange={(checked) => props.onRowVisibilityChange(option.key, checked)}
            textVariant="large"
            label={option.label}
          />
        )}
      </For>
    </div>
  </div>
)

/**
 * 更新差分レポートに含める集計セクションと統計行を選択する設定を表示する。
 *
 * @param props - 各セクションと統計行の表示状態、および変更ハンドラー。
 * @returns 更新差分の表示設定。
 */
const RegisterScoreDisplaySettings = (props: {
  showTotalHighScore: boolean
  showRecordStatistics: boolean
  totalHighScoreRowVisibility: RegisterScoreAggregateRowVisibility
  statisticRowVisibility: RegisterScoreAggregateRowVisibility
  onShowTotalHighScoreChange: (checked: boolean) => void
  onShowRecordStatisticsChange: (checked: boolean) => void
  onTotalHighScoreRowVisibilityChange: (key: RegisterScoreAggregateRowKey, checked: boolean) => void
  onStatisticRowVisibilityChange: (key: RegisterScoreAggregateRowKey, checked: boolean) => void
}) => (
  <fieldset class="rounded-md border border-border bg-surface px-4 pb-4 pt-3">
    <legend class="px-1 text-lg font-semibold text-text">
      {REGISTER_SCORE_MESSAGES.displaySettingsTitle}
    </legend>
    <div class="mt-1 flex flex-col items-start gap-3">
      <RegisterScoreAggregateVisibilitySettings
        label={REGISTER_SCORE_MESSAGES.totalHighScoreTitle}
        checked={props.showTotalHighScore}
        rowVisibility={props.totalHighScoreRowVisibility}
        onChange={props.onShowTotalHighScoreChange}
        onRowVisibilityChange={props.onTotalHighScoreRowVisibilityChange}
      />
      <RegisterScoreAggregateVisibilitySettings
        label={REGISTER_SCORE_MESSAGES.recordStatsTitle}
        checked={props.showRecordStatistics}
        rowVisibility={props.statisticRowVisibility}
        onChange={props.onShowRecordStatisticsChange}
        onRowVisibilityChange={props.onStatisticRowVisibilityChange}
      />
    </div>
  </fieldset>
)

/**
 * 登録後の通常譜面集計を表示する。
 *
 * @param props - APIから返却された通常譜面集計と表示設定。
 * @returns 集計値セクション。
 */
const RegisterScoreAggregateSummary = (props: {
  result: PlayerDataUpdateResult
  showTotalHighScore: boolean
  showRecordStatistics: boolean
  totalHighScoreRowVisibility: RegisterScoreAggregateRowVisibility
  statisticRowVisibility: RegisterScoreAggregateRowVisibility
}) => {
  const statisticRows = createMemo(() =>
    toRegisterScoreStatisticRows(props.result.statistics).filter(
      (row) => props.statisticRowVisibility[row.key]
    )
  )
  const totalHighScoreRows = createMemo(() =>
    toRegisterScoreTotalHighScoreRows(props.result.statistics).filter(
      (row) => props.totalHighScoreRowVisibility[row.key]
    )
  )

  return (
    <>
      <Show when={props.showTotalHighScore && totalHighScoreRows().length > 0}>
        <section class="py-4">
          <h2 class="mb-3 text-xl font-extrabold leading-6">
            {REGISTER_SCORE_MESSAGES.totalHighScoreTitle}
          </h2>
          <div class="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
            <For each={totalHighScoreRows()}>
              {(row) => (
                <p class="grid grid-cols-[2.25rem_1fr] items-baseline gap-1">
                  <span class={`font-extrabold ${getDifficultyTextClass(row.difficulty)}`}>
                    {row.label}
                  </span>
                  <span class="min-w-0">
                    <span class="block font-jost font-medium">{formatScore(row.value.after)}</span>
                    <Show when={row.value.delta !== 0}>
                      <span
                        class={`block font-jost text-xs font-bold ${getTotalHighScoreDeltaClass(row.value.delta)}`}
                      >
                        ({formatStatisticDelta(row.value.delta)})
                      </span>
                    </Show>
                  </span>
                </p>
              )}
            </For>
          </div>
        </section>
      </Show>

      <Show when={props.showRecordStatistics && statisticRows().length > 0}>
        <section class="py-4">
          <h2 class="mb-3 text-xl font-extrabold leading-6">
            {REGISTER_SCORE_MESSAGES.recordStatsTitle}
          </h2>
          <RegisterScoreLampStatistics rows={statisticRows()} />
        </section>
      </Show>
    </>
  )
}

/**
 * ランプ統計を表示領域内へ均等配置した表で表示する。
 *
 * @param props - 表示対象の統計行。
 * @returns ランプ統計テーブル。
 */
const RegisterScoreLampStatistics = (props: { rows: RegisterScoreStatisticRow[] }) => (
  <div class="w-full">
    <table class="w-full table-fixed border-collapse text-center text-sm">
      <thead>
        <tr class="border-b border-border text-xs font-extrabold">
          <th class="w-12 border-r border-border px-1 py-1 text-center"></th>
          <For each={REGISTER_SCORE_STAT_COLUMNS}>
            {(column) => (
              <th class={`px-1 py-1 ${getRegisterScoreStatisticColumnDividerClass(column)}`}>
                {column}
              </th>
            )}
          </For>
        </tr>
      </thead>
      <tbody>
        <For each={props.rows}>
          {(row, index) => (
            <tr
              class={`${index() < props.rows.length - 1 ? 'border-b border-border ' : ''}align-top`}
            >
              <th
                class={`border-r border-border px-1 py-2 text-center text-sm font-extrabold ${getDifficultyTextClass(row.difficulty)}`}
              >
                {row.label}
              </th>
              <For each={REGISTER_SCORE_STAT_COLUMNS}>
                {(column) => (
                  <td
                    class={`px-1 py-2 leading-4 ${getRegisterScoreStatisticColumnDividerClass(column)}`}
                  >
                    <div class="font-jost">{row.values[column].after}</div>
                    <Show when={row.values[column].delta !== 0}>
                      <div class="font-jost text-[0.65rem] font-bold text-blue-700">
                        {formatStatisticDelta(row.values[column].delta)}
                      </div>
                    </Show>
                  </td>
                )}
              </For>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  </div>
)

/**
 * プレイ前スコアを表示する。
 *
 * 未プレイの場合は薄い文字でハイフンを表示し、プレイ済みの場合はスコアを通常表示する。
 * プレイ済みでスコアが 0 の場合も本来の 0 として表示する。
 *
 * @param props.before - 差分前の譜面状態。`null` の場合は未プレイとして扱う。
 * @returns プレイ前スコアまたはハイフンの表示要素。
 */
const BeforeRecordScore = (props: {
  before: PlayerDataRecordState | PlayerDataCourseRecordState | null
}) => (
  <Show
    when={props.before}
    fallback={<span class="font-jost font-semibold text-text-subtle">{NO_DATA_TEXT}</span>}
  >
    {(before) => <span class="font-jost font-semibold">{formatScore(before().score)}</span>}
  </Show>
)

/**
 * 1譜面分の登録差分をスクリーンショットに近い行表示にする。
 *
 * @param props - 表示対象の差分、解決済み楽曲タイトル、譜面レベル。
 * @returns 差分行。
 */
const RegisterScoreChangeRow = (props: {
  change: PlayerDataSongRecordChange
  songTitle: string
  chartLevel?: string
}) => {
  return (
    <article class={`${SCORE_CHANGE_CARD_CLASS} font-jost`}>
      <div class="flex min-w-0 items-center gap-2 text-base">
        <span class={`${DIFFICULTY_BADGE_LAYOUT_CLASS} ${getDifficultyBadgeClass(props.change)}`}>
          {getShortDifficultyLabel(props.change)}
        </span>
        <Show when={props.chartLevel}>
          {(level) => (
            <span class="shrink-0 whitespace-nowrap rounded bg-surface px-2 py-0.5 text-xs font-bold leading-5">
              {level()}
            </span>
          )}
        </Show>
        <h3 class="min-w-0 flex-1 truncate font-sans text-base font-bold">{props.songTitle}</h3>
      </div>
      <div class={SCORE_CHANGE_SCORE_GRID_CLASS}>
        <div class="w-fit">
          <BeforeRecordScore before={props.change.before} />
          <Show
            when={props.change.before}
            fallback={
              <div class="mt-1 flex min-h-6 flex-wrap items-center gap-1">
                <LampPlaceholderBadge class="w-[34px]" />
                <LampPlaceholderBadge class="w-[34px]" />
                <LampPlaceholderBadge class="w-[34px]" />
              </div>
            }
          >
            {(before) => <RecordLampBadges state={before()} />}
          </Show>
        </div>
        <div class="flex w-20 flex-col items-center gap-1">
          <Play class="mt-1.5 h-3.5 w-3.5 fill-current text-blue-700" aria-hidden="true" />
          <Show when={formatScoreDelta(props.change)}>
            {(delta) => (
              <span class="font-sans text-sm font-bold leading-4 text-blue-700">{delta()}</span>
            )}
          </Show>
        </div>
        <div class="w-fit">
          <span class="font-jost font-semibold">{formatScore(props.change.after.score)}</span>
          <RecordLampBadges state={props.change.after} />
        </div>
      </div>
    </article>
  )
}

/**
 * 1コース分の登録差分を、コース固有の状態だけで表示する。
 *
 * @param props - 表示対象のコース差分と解決済みコースタイトル。
 * @returns コース差分行。
 */
const RegisterCourseChangeRow = (props: {
  change: PlayerDataCourseRecordChange
  courseTitle: string
}) => (
  <article class={`${SCORE_CHANGE_CARD_CLASS} font-jost`}>
    <div class="flex min-w-0 items-center gap-2 text-base">
      <span
        class={`${COURSE_CLASS_BADGE_LAYOUT_CLASS} whitespace-nowrap ${courseClassBadgeClass(
          props.change.course_class
        )}`}
      >
        {formatCourseClass(props.change.course_class)}
      </span>
      <h3 class="min-w-0 flex-1 truncate font-sans text-base font-bold">{props.courseTitle}</h3>
    </div>
    <div class={SCORE_CHANGE_SCORE_GRID_CLASS}>
      <div class={COURSE_CHANGE_SCORE_VALUE_CLASS}>
        <BeforeRecordScore before={props.change.before} />
        <Show
          when={props.change.before}
          fallback={
            <div class="mt-1 flex min-h-6 flex-wrap items-center gap-1">
              <LampPlaceholderBadge class="w-[34px]" />
              <LampPlaceholderBadge class="w-[34px]" />
            </div>
          }
        >
          {(before) => <CourseRecordLampBadges state={before()} />}
        </Show>
      </div>
      <div class="flex w-20 flex-col items-center gap-1">
        <Play class="mt-1.5 h-3.5 w-3.5 fill-current text-blue-700" aria-hidden="true" />
        <Show when={formatScoreDelta(props.change)}>
          {(delta) => (
            <span class="font-sans text-sm font-bold leading-4 text-blue-700">{delta()}</span>
          )}
        </Show>
      </div>
      <div class={COURSE_CHANGE_SCORE_VALUE_CLASS}>
        <span class="font-jost font-semibold">{formatScore(props.change.after.score)}</span>
        <CourseRecordLampBadges state={props.change.after} />
      </div>
    </div>
  </article>
)

/**
 * スコア登録結果のヘッダーを表示する。
 *
 * @param props - APIから返却された登録結果。
 * @returns レポートヘッダー。
 */
const RegisterScoreReportHeader = (props: { result: PlayerDataUpdateResult }) => (
  <header class="flex items-center justify-between border-b border-border bg-surface-muted px-3 py-3">
    <span
      aria-hidden="true"
      class="h-12 w-12 shrink-0"
      style={{
        'background-color': REGISTER_SCORE_REPORT_LOGO_COLOR,
        'mask-image': `url(${logoSingle})`,
        'mask-position': 'center',
        'mask-repeat': 'no-repeat',
        'mask-size': 'contain',
      }}
    />
    <div class="min-w-0 text-right">
      <h1 class="whitespace-nowrap text-2xl font-bold">{REGISTER_SCORE_MESSAGES.reportTitle}</h1>
      <p class="mt-1 text-sm">
        <span class="font-jost">{formatImportedAt(props.result.imported_at)}</span>
      </p>
    </div>
  </header>
)

/**
 * 更新レコード一覧を表示する。
 *
 * @param props - 更新差分、楽曲名解決関数、譜面レベル解決関数。
 * @returns 更新レコードセクション。
 */
const RegisterScoreChangesSection = (props: {
  changes: PlayerDataSongRecordChange[]
  resolveSongTitle: RegisterScoreSongTitleResolver
  resolveChartLevel?: RegisterScoreChartLevelResolver
  emptyMessage?: string
}) => (
  <section class="min-w-0 pt-4">
    <h2 class="mb-1 text-xl font-bold">{REGISTER_SCORE_MESSAGES.changedSongsTitle}</h2>
    <Show
      when={props.changes.length > 0}
      fallback={
        <p class="px-2 py-6 text-center text-sm text-text-muted">
          {props.emptyMessage ?? REGISTER_SCORE_MESSAGES.changedSongsEmpty}
        </p>
      }
    >
      <div class="mt-2 grid min-w-0 max-w-full gap-2">
        <For each={props.changes}>
          {(change) => (
            <RegisterScoreChangeRow
              change={change}
              songTitle={props.resolveSongTitle(change)}
              chartLevel={props.resolveChartLevel?.(change)}
            />
          )}
        </For>
      </div>
    </Show>
  </section>
)

/**
 * 更新されたコースレコードをレポート末尾へ表示する。
 *
 * @param props - コースレコード差分とコースタイトル解決関数。
 * @returns コースレコードセクション。差分がない場合は何も表示しない。
 */
const RegisterCourseChangesSection = (props: {
  changes: PlayerDataCourseRecordChange[]
  resolveCourseTitle: RegisterScoreCourseTitleResolver
}) => (
  <Show when={props.changes.length > 0}>
    <section class="min-w-0 pt-4">
      <h2 class="mb-1 text-xl font-bold">{REGISTER_SCORE_MESSAGES.changedCoursesTitle}</h2>
      <div class="mt-2 grid min-w-0 max-w-full gap-2">
        <For each={props.changes}>
          {(change) => (
            <RegisterCourseChangeRow
              change={change}
              courseTitle={props.resolveCourseTitle(change)}
            />
          )}
        </For>
      </div>
    </section>
  </Show>
)

/**
 * スコア登録完了後の結果と差分一覧を表示する。
 *
 * @param props - 登録結果、楽曲名・コースタイトル解決関数、譜面レベル解決関数、空状態文言。
 * @returns 登録結果パネル。
 */
export const RegisterScoreResultView = (props: {
  result: PlayerDataUpdateResult
  resolveSongTitle: RegisterScoreSongTitleResolver
  resolveChartLevel?: RegisterScoreChartLevelResolver
  resolveCourseTitle: RegisterScoreCourseTitleResolver
  changedSongsEmptyMessage?: string
}) => {
  const songChanges = createMemo(() =>
    props.result.changes.filter(
      (change): change is PlayerDataSongRecordChange => change.record_type !== 'course'
    )
  )
  const courseChanges = createMemo(() =>
    props.result.changes.filter(
      (change): change is PlayerDataCourseRecordChange => change.record_type === 'course'
    )
  )
  const [showTotalHighScore, setShowTotalHighScore] = createSignal(true)
  const [showRecordStatistics, setShowRecordStatistics] = createSignal(true)
  const [totalHighScoreRowVisibility, setTotalHighScoreRowVisibility] =
    createSignal<RegisterScoreAggregateRowVisibility>(
      createDefaultRegisterScoreTotalHighScoreRowVisibility(props.result.statistics)
    )
  const [statisticRowVisibility, setStatisticRowVisibility] =
    createSignal<RegisterScoreAggregateRowVisibility>(
      createDefaultRegisterScoreStatisticRowVisibility(props.result.statistics)
    )
  const [reportScale, setReportScale] = createSignal(1)
  const [scaledReportHeight, setScaledReportHeight] = createSignal<number>()
  const [isDownloadingImage, setIsDownloadingImage] = createSignal(false)
  const [downloadImageError, setDownloadImageError] = createSignal<string>()
  let scaleContainerRef!: HTMLDivElement
  let reportRef!: HTMLElement

  /**
   * TOTAL HIGH SCOREの1行分の表示状態を更新する。
   *
   * @param key - 更新する集計行のキー。
   * @param checked - 更新後の表示状態。
   * @returns なし。
   */
  const updateTotalHighScoreRowVisibility = (
    key: RegisterScoreAggregateRowKey,
    checked: boolean
  ): void => {
    setTotalHighScoreRowVisibility((current) => ({ ...current, [key]: checked }))
  }

  /**
   * RECORD STATISTICSの1行分の表示状態を更新する。
   *
   * @param key - 更新する統計行のキー。
   * @param checked - 更新後の表示状態。
   * @returns なし。
   */
  const updateStatisticRowVisibility = (
    key: RegisterScoreAggregateRowKey,
    checked: boolean
  ): void => {
    setStatisticRowVisibility((current) => ({ ...current, [key]: checked }))
  }

  /**
   * 現在表示中の更新差分レポートを1枚のPNG画像としてダウンロードする。
   *
   * @returns ダウンロード処理の完了時に解決されるPromise。
   */
  const downloadReportImage = async (): Promise<void> => {
    setIsDownloadingImage(true)
    setDownloadImageError(undefined)

    try {
      await document.fonts.ready
      const capture = createRegisterScoreImageCapture(reportRef)

      try {
        const { snapdom } = await import('@zumer/snapdom')
        const captureResult = await snapdom(capture.element, {
          backgroundColor: getComputedStyle(reportRef).backgroundColor,
          dpr: REGISTER_SCORE_IMAGE_PIXEL_RATIO,
          embedFonts: true,
          format: 'png',
          reconcile: true,
        })
        const rasterizeOptions = {
          dpr: REGISTER_SCORE_IMAGE_PIXEL_RATIO,
          type: 'png' as const,
        }

        // ChromeがSVG内の埋め込みフォントを初回描画で準備するため、1回目は破棄する。
        await captureResult.toBlob(rasterizeOptions)
        const imageBlob = await captureResult.toBlob(rasterizeOptions)
        downloadRegisterScoreFile(
          imageBlob,
          formatRegisterScoreImageFilename(props.result.imported_at)
        )
      } finally {
        capture.dispose()
      }
    } catch {
      setDownloadImageError(REGISTER_SCORE_MESSAGES.downloadImageError)
    } finally {
      setIsDownloadingImage(false)
    }
  }

  onMount(() => {
    /**
     * 固定幅レポートを親要素の表示幅へ収める縮小率と占有高さを更新する。
     *
     * @returns なし。
     */
    const updateReportScale = () => {
      const scale = Math.min(1, scaleContainerRef.clientWidth / reportRef.offsetWidth)

      setReportScale(scale)
      setScaledReportHeight(reportRef.offsetHeight * scale)
    }

    const resizeObserver = new ResizeObserver(updateReportScale)
    resizeObserver.observe(scaleContainerRef)
    resizeObserver.observe(reportRef)
    updateReportScale()

    onCleanup(() => resizeObserver.disconnect())
  })

  return (
    <div class={`mx-auto flex w-full ${REGISTER_SCORE_REPORT_MAX_WIDTH_CLASS} flex-col gap-4`}>
      <div class="flex flex-col items-end gap-2">
        <AppButton
          variant="primary"
          disabled={isDownloadingImage()}
          aria-busy={isDownloadingImage()}
          onClick={downloadReportImage}
          leftIcon={
            <Show when={!isDownloadingImage()} fallback={<Loading size="inline" ariaHidden />}>
              <Download class="h-4 w-4" aria-hidden="true" />
            </Show>
          }
        >
          {isDownloadingImage()
            ? REGISTER_SCORE_MESSAGES.downloadingImage
            : REGISTER_SCORE_MESSAGES.downloadImage}
        </AppButton>
        <Show when={downloadImageError()}>
          {(message) => (
            <p class="text-sm text-danger" role="alert">
              {message()}
            </p>
          )}
        </Show>
      </div>
      <RegisterScoreDisplaySettings
        showTotalHighScore={showTotalHighScore()}
        showRecordStatistics={showRecordStatistics()}
        totalHighScoreRowVisibility={totalHighScoreRowVisibility()}
        statisticRowVisibility={statisticRowVisibility()}
        onShowTotalHighScoreChange={setShowTotalHighScore}
        onShowRecordStatisticsChange={setShowRecordStatistics}
        onTotalHighScoreRowVisibilityChange={updateTotalHighScoreRowVisibility}
        onStatisticRowVisibilityChange={updateStatisticRowVisibility}
      />
      <div
        ref={scaleContainerRef}
        class={`w-full ${REGISTER_SCORE_REPORT_MAX_WIDTH_CLASS} overflow-hidden`}
        style={{ height: scaledReportHeight() ? `${scaledReportHeight()}px` : undefined }}
      >
        <div
          class={`${REGISTER_SCORE_REPORT_WIDTH_CLASS} origin-top-left`}
          style={{ transform: `scale(${reportScale()})` }}
        >
          <section
            ref={reportRef}
            data-theme="light"
            class="w-full overflow-hidden rounded-md border border-border bg-surface px-0 pb-4 pt-0 font-sans text-text shadow-sm"
          >
            <RegisterScoreReportHeader result={props.result} />
            <div class="px-4 pt-3">
              <RegisterScoreProfileSummary result={props.result} />
              <RegisterScoreAggregateSummary
                result={props.result}
                showTotalHighScore={showTotalHighScore()}
                showRecordStatistics={showRecordStatistics()}
                totalHighScoreRowVisibility={totalHighScoreRowVisibility()}
                statisticRowVisibility={statisticRowVisibility()}
              />
              <RegisterScoreChangesSection
                changes={songChanges()}
                resolveSongTitle={props.resolveSongTitle}
                resolveChartLevel={props.resolveChartLevel}
                emptyMessage={props.changedSongsEmptyMessage}
              />
              <RegisterCourseChangesSection
                changes={courseChanges()}
                resolveCourseTitle={props.resolveCourseTitle}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

import { Play } from 'lucide-solid'
import { createMemo, For, Show } from 'solid-js'

import type {
  PlayerDataDifficulty,
  PlayerDataNumberDiff,
  PlayerDataRecordChange,
  PlayerDataRecordState,
  PlayerDataResult,
  PlayerDataStatistics,
  PlayerDataStatisticsGroup,
} from '../../types/api'
import { difficultyBadgeClass } from '../../utils/difficultyUtils'
import {
  HARD_LAMP_BADGE_BACKGROUND_CLASS,
  type SharedClearLamp,
  type SharedComboLamp,
} from '../users/components/recordStyleClasses'
import {
  RecordFullChainCell,
  RecordHardLampCell,
  RecordLampCell,
} from '../users/components/SharedRecordTableColumns'
import { formatOverPowerPercent, formatOverPowerValue } from '../users/utils/overPowerFormat'
import { formatPlayerRating } from '../users/utils/ratingFormat'

export const REGISTER_SCORE_MESSAGES = {
  invalidToken: 'tokenが不正です。登録用URLを確認してください。',
  fallbackError: '登録に失敗しました。',
  reportTitle: '更新差分',
  title: 'スコア登録',
  processing: 'スコアデータを登録しています。',
  changedSongsTitle: 'NEW RECORDS',
  changedSongsEmpty: '今回更新された楽曲はありません。',
  totalHighScoreTitle: 'TOTAL HIGH SCORE',
  recordStatsTitle: 'RECORD STATISTICS',
  unknownSongTitle: '-',
} as const

const NO_DATA_TEXT = '-'
const WORLD_END_BADGE_CLASS =
  'bg-[image:var(--cs-color-worldsend-label-bg)] text-worldsend-label-text'
const REGISTER_SCORE_DIFFICULTIES: readonly PlayerDataDifficulty[] = [
  'BASIC',
  'ADVANCED',
  'EXPERT',
  'MASTER',
  'ULTIMA',
]
const REGISTER_SCORE_STAT_COLUMNS = ['AJ', 'FC', 'MAX', 'SSS+', 'SSS', 'SS+', 'SS'] as const
const REGISTER_SCORE_MAIN_STAT_ROW_LABEL = 'ALL'
const PROFILE_VALUE_CLASS = 'font-jost text-base font-normal leading-6'
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
 * 更新前後のスコア領域を安定した3カラムにする共通クラス。
 */
const SCORE_CHANGE_SCORE_GRID_CLASS =
  'mt-1.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-x-2 text-lg leading-6'

type RegisterScoreLampRecord = {
  is_played: boolean
  score: number
  clear_lamp: SharedClearLamp
  combo_lamp: SharedComboLamp
  full_chain: 'FULL CHAIN GOLD' | 'FULL CHAIN PLATINUM' | null
}

type RegisterScoreStatisticRow = {
  label: string
  difficulty: PlayerDataDifficulty | null
  values: Record<(typeof REGISTER_SCORE_STAT_COLUMNS)[number], PlayerDataNumberDiff>
}

export type RegisterScoreSongTitleResolver = (change: PlayerDataRecordChange) => string
export type RegisterScoreChartLevelResolver = (change: PlayerDataRecordChange) => string | undefined

/**
 * 1統計グループを表示用の統計行へ変換する。
 *
 * @param label - 行見出し。
 * @param group - APIが返す統計グループ。
 * @returns 表示用の統計行。
 */
const toRegisterScoreStatisticRow = (
  label: string,
  group: PlayerDataStatisticsGroup,
  difficulty: PlayerDataDifficulty | null = null
): RegisterScoreStatisticRow => ({
  label,
  difficulty,
  values: {
    AJ: group.record_statistics.aj,
    FC: group.record_statistics.fc,
    MAX: group.record_statistics.max,
    'SSS+': group.record_statistics.sss_plus,
    SSS: group.record_statistics.sss,
    'SS+': group.record_statistics.ss_plus,
    SS: group.record_statistics.ss,
  },
})

/**
 * 全体と固定5難易度の統計行を生成する。
 *
 * @param statistics - APIが返す全体および難易度別の統計差分。
 * @returns 全体、BASIC、ADVANCED、EXPERT、MASTER、ULTIMAの表示行。
 */
const toRegisterScoreStatisticRows = (
  statistics: PlayerDataStatistics
): RegisterScoreStatisticRow[] => [
  toRegisterScoreStatisticRow(REGISTER_SCORE_MAIN_STAT_ROW_LABEL, statistics.overall),
  ...REGISTER_SCORE_DIFFICULTIES.map((difficulty) =>
    toRegisterScoreStatisticRow(
      difficulty.slice(0, 3),
      statistics.by_difficulty[difficulty],
      difficulty
    )
  ),
]

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
 * スコア増分を括弧付きの表示文字列へ変換する。
 *
 * @param change - APIから返却された1譜面分の差分。
 * @returns 増分がある場合は括弧付きの文字列、それ以外は空文字。
 */
const formatScoreDeltaWithParens = (change: PlayerDataRecordChange): string => {
  const delta = formatScoreDelta(change)
  return delta ? `(${delta})` : ''
}

/**
 * ISO日時を画面表示用の日時文字列へ変換する。
 *
 * @param isoDateTime - APIから返却されたISO形式の日時。
 * @returns `YYYY-MM-DD HH:mm:ss` 形式の日時文字列。
 */
const formatImportedAt = (isoDateTime: string): string => {
  const date = new Date(isoDateTime)

  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

/**
 * 難易度を短縮表記へ変換する。
 *
 * @param change - APIから返却された1譜面分の差分。
 * @returns 難易度の短縮表記。
 */
const getShortDifficultyLabel = (change: PlayerDataRecordChange): string => {
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
const getDifficultyBadgeClass = (change: PlayerDataRecordChange): string => {
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
 * プレイヤー概要をレポート形式で表示する。
 *
 * @param props - APIから返却された登録結果。
 * @returns プロフィール概要。
 */
const RegisterScoreProfileSummary = (props: { result: PlayerDataResult }) => (
  <section class="border-b border-border pb-3">
    <div class="flex items-center gap-2 border-b border-border bg-surface-muted px-3 py-2.5">
      <p class="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 font-sans text-xl font-extrabold leading-none">
        <span class="shrink-0 tracking-normal">Lv. {props.result.profile.level}</span>
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
 * 登録後の通常譜面集計を表示する。
 *
 * @param props - APIから返却された通常譜面集計。
 * @returns 集計値セクション。
 */
const RegisterScoreAggregateSummary = (props: { result: PlayerDataResult }) => {
  const statisticRows = createMemo(() => toRegisterScoreStatisticRows(props.result.statistics))
  const totalHighScoreRows = createMemo(() => [
    {
      label: REGISTER_SCORE_MAIN_STAT_ROW_LABEL,
      difficulty: null,
      value: props.result.statistics.overall.total_high_score,
    },
    ...REGISTER_SCORE_DIFFICULTIES.map((difficulty) => ({
      label: difficulty.slice(0, 3),
      difficulty,
      value: props.result.statistics.by_difficulty[difficulty].total_high_score,
    })),
  ])

  return (
    <>
      <section class="border-b border-border py-4">
        <h2 class="mb-3 text-xl font-extrabold leading-6">
          {REGISTER_SCORE_MESSAGES.totalHighScoreTitle}
        </h2>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
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

      <section class="border-b border-border py-4">
        <h2 class="mb-3 text-xl font-extrabold leading-6">
          {REGISTER_SCORE_MESSAGES.recordStatsTitle}
        </h2>
        <RegisterScoreLampStatistics rows={statisticRows()} />
      </section>
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
          <th class="w-12 px-1 py-1 text-left"></th>
          <For each={REGISTER_SCORE_STAT_COLUMNS}>
            {(column) => <th class="px-1 py-1">{column}</th>}
          </For>
        </tr>
      </thead>
      <tbody>
        <For each={props.rows}>
          {(row) => (
            <tr class="border-b border-border align-top">
              <th
                class={`px-1 py-2 text-left text-sm font-extrabold ${getDifficultyTextClass(row.difficulty)}`}
              >
                {row.label}
              </th>
              <For each={REGISTER_SCORE_STAT_COLUMNS}>
                {(column) => (
                  <td class="px-1 py-2 leading-4">
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
 * 1譜面分の登録差分をスクリーンショットに近い行表示にする。
 *
 * @param props - 表示対象の差分、解決済み楽曲タイトル、譜面レベル。
 * @returns 差分行。
 */
const RegisterScoreChangeRow = (props: {
  change: PlayerDataRecordChange
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
            <span class="shrink-0 rounded bg-surface px-2 py-0.5 text-xs font-bold leading-5">
              {level()}
            </span>
          )}
        </Show>
        <h3 class="min-w-0 truncate font-sans text-base font-bold">{props.songTitle}</h3>
      </div>
      <div class={SCORE_CHANGE_SCORE_GRID_CLASS}>
        <div class="min-w-0">
          <span class="font-oswald font-semibold">
            {props.change.before ? formatScore(props.change.before.score) : NO_DATA_TEXT}
          </span>
          <Show when={props.change.before}>
            {(before) => <RecordLampBadges state={before()} />}
          </Show>
        </div>
        <Play
          class="mt-1.5 h-3.5 w-3.5 justify-self-center fill-current text-action-primary"
          aria-hidden="true"
        />
        <div class="min-w-0">
          <span class="font-oswald font-semibold">
            {formatScore(props.change.after.score)}{' '}
            <Show when={formatScoreDeltaWithParens(props.change)}>
              {(delta) => <span class="font-sans text-xs font-bold text-blue-700">{delta()}</span>}
            </Show>
          </span>
          <RecordLampBadges state={props.change.after} />
        </div>
      </div>
    </article>
  )
}

/**
 * スコア登録結果のヘッダーを表示する。
 *
 * @param props - APIから返却された登録結果。
 * @returns レポートヘッダー。
 */
const RegisterScoreReportHeader = (props: { result: PlayerDataResult }) => (
  <header class="border-b border-border bg-surface-muted px-3 py-3">
    <h1 class="text-2xl font-bold">{REGISTER_SCORE_MESSAGES.reportTitle}</h1>
    <p class="mt-1 text-sm">
      更新日時: <span class="font-jost">{formatImportedAt(props.result.imported_at)}</span>
    </p>
  </header>
)

/**
 * 更新レコード一覧を表示する。
 *
 * @param props - 更新差分、楽曲名解決関数、譜面レベル解決関数。
 * @returns 更新レコードセクション。
 */
const RegisterScoreChangesSection = (props: {
  changes: PlayerDataRecordChange[]
  resolveSongTitle: RegisterScoreSongTitleResolver
  resolveChartLevel?: RegisterScoreChartLevelResolver
}) => (
  <section class="min-w-0 pt-4">
    <h2 class="mb-1 text-xl font-bold">{REGISTER_SCORE_MESSAGES.changedSongsTitle}</h2>
    <Show
      when={props.changes.length > 0}
      fallback={
        <p class="border-t border-border px-2 py-6 text-center text-sm text-text-muted">
          {REGISTER_SCORE_MESSAGES.changedSongsEmpty}
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
 * スコア登録完了後の結果と差分一覧を表示する。
 *
 * @param props - 登録結果、楽曲名解決関数、譜面レベル解決関数。
 * @returns 登録結果パネル。
 */
export const RegisterScoreResultView = (props: {
  result: PlayerDataResult
  resolveSongTitle: RegisterScoreSongTitleResolver
  resolveChartLevel?: RegisterScoreChartLevelResolver
}) => {
  const changes = createMemo(() => props.result.changes)

  return (
    <section
      data-theme="light"
      class="mx-auto w-full max-w-[31rem] overflow-hidden rounded-md border border-border bg-surface px-0 pb-4 pt-0 font-sans text-text shadow-sm"
    >
      <RegisterScoreReportHeader result={props.result} />
      <div class="px-2 pt-3 sm:px-4">
        <RegisterScoreProfileSummary result={props.result} />
        <RegisterScoreAggregateSummary result={props.result} />
        <RegisterScoreChangesSection
          changes={changes()}
          resolveSongTitle={props.resolveSongTitle}
          resolveChartLevel={props.resolveChartLevel}
        />
      </div>
    </section>
  )
}

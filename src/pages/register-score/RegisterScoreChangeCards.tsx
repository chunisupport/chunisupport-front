import { Button } from '@kobalte/core/button'
import { Copy, Eye, EyeOff, Play } from 'lucide-solid'
import { createMemo, createSignal, onCleanup, Show } from 'solid-js'
import { AppIconButton } from '../../components/common/AppButton'
import { showErrorToast, showSuccessToast } from '../../components/common/AppToast'
import { LampPlaceholderBadge } from '../../components/common/record/RecordBadges'
import {
  RecordFullChainCell,
  RecordHardLampCell,
  RecordLampCell,
} from '../../components/common/record/RecordDisplayParts'
import type {
  PlayerDataCourseRecordChange,
  PlayerDataCourseRecordState,
  PlayerDataRecordState,
  PlayerDataSongRecordChange,
} from '../../types/api'
import { formatInteger } from '../../utils/numberFormat'
import { formatOverPowerPercent, formatOverPowerValue } from '../../utils/overPowerFormat'
import { formatRatingFixed2 } from '../../utils/ratingFormat'
import {
  REGISTER_SCORE_COPY,
  REGISTER_SCORE_SHOW_SONG_METRICS,
  REGISTER_SCORE_SHOW_SONG_OP_PERCENT,
} from './constants'
import {
  courseClassBadgeClass,
  formatCourseClass,
  formatRegisterScoreChangeDelta,
  getRegisterScoreDifficultyBadgeClass,
  getRegisterScoreShortDifficultyLabel,
  REGISTER_SCORE_NO_DATA_TEXT,
  toRegisterScoreCourseLampRecord,
  toRegisterScoreLampRecord,
} from './registerScoreDisplay'
import type {
  RegisterScoreSongMetricChange,
  RegisterScoreSongMetrics,
} from './registerScoreResolvers'

/** コピー成功時に曲名をアクセントカラーで保持する時間 */
const REGISTER_SCORE_COPY_HIGHLIGHT_MS = 100

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
/** コース差分のスコアとランプ表示領域を固定幅にするクラス */
const COURSE_CHANGE_SCORE_VALUE_CLASS = 'w-[95px] shrink-0'
/** コースクラスバッジの共通レイアウトクラス */
const COURSE_CLASS_BADGE_LAYOUT_CLASS =
  'inline-flex min-w-6 shrink-0 items-center justify-center rounded font-sans text-xs font-bold uppercase leading-5 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]'

/**
 * 曲名をクリップボードへコピーし、結果をトーストで通知する。
 *
 * @param songTitle - コピーする省略前の曲名。
 * @returns コピーに成功した場合はtrue、それ以外はfalse。
 */
const copyRegisterScoreSongTitle = async (songTitle: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(songTitle)
    showSuccessToast(REGISTER_SCORE_COPY.copySongTitleSuccess)
    return true
  } catch {
    showErrorToast(REGISTER_SCORE_COPY.copySongTitleError)
    return false
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
  const record = createMemo(() => toRegisterScoreCourseLampRecord(props.state))

  return (
    <div class="mt-1 flex min-h-6 flex-wrap items-center gap-1">
      <RecordHardLampCell record={record()} />
      <RecordLampCell record={record()} />
    </div>
  )
}

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
    fallback={
      <span class="font-jost font-semibold text-text-subtle">{REGISTER_SCORE_NO_DATA_TEXT}</span>
    }
  >
    {(before) => <span class="font-jost font-semibold">{formatInteger(before().score)}</span>}
  </Show>
)

/**
 * スコア増分を表示する。新規登録やスコア上昇なしの場合は何も表示しない。
 *
 * @param props - 表示対象の楽曲またはコース差分。
 * @returns 更新前後のスコアの間に置く矢印と増分。
 */
const RegisterScoreChangeDelta = (props: {
  change: PlayerDataSongRecordChange | PlayerDataCourseRecordChange
}) => (
  <>
    <Play class="mt-1.5 h-3.5 w-3.5 fill-current text-blue-700" aria-hidden="true" />
    <Show when={formatRegisterScoreChangeDelta(props.change)}>
      {(delta) => (
        <span class="font-sans text-sm font-bold leading-4 text-blue-700">{delta()}</span>
      )}
    </Show>
  </>
)

/**
 * 更新差分カードを共有・ダウンロード画像へ含めるか切り替える。
 *
 * @param props - 現在の画像除外状態と変更ハンドラー。
 * @returns 画像除外状態を切り替えるアイコンボタン。
 */
const RegisterScoreImageExclusionButton = (props: {
  excludedFromImage: boolean
  onChange: (excluded: boolean) => void
}) => (
  <AppIconButton
    tone="ghost"
    class="absolute right-1 top-1"
    aria-label={REGISTER_SCORE_COPY.excludeChangeFromImage}
    aria-pressed={props.excludedFromImage}
    title={
      props.excludedFromImage
        ? REGISTER_SCORE_COPY.includeChangeInImage
        : REGISTER_SCORE_COPY.excludeChangeFromImage
    }
    data-image-capture-excluded="true"
    onClick={() => props.onChange(!props.excludedFromImage)}
  >
    <Show when={props.excludedFromImage} fallback={<Eye class="h-5 w-5" aria-hidden="true" />}>
      <EyeOff class="h-5 w-5" aria-hidden="true" />
    </Show>
  </AppIconButton>
)

/**
 * 前後のスコアの下に単曲レーティングとOP値を横並びで表示する。
 *
 * @param props - 一方の記録のメトリクス。新規記録の更新前はnull。
 * @returns ラベルと固定桁の数値を並べた表示。
 */
const RegisterScoreSongMetricValues = (props: { metrics: RegisterScoreSongMetrics | null }) => (
  <dl class="mt-1.5 grid grid-cols-[auto_1fr_auto_1fr] items-baseline gap-x-2 whitespace-nowrap text-sm leading-5">
    <dt class="font-sans text-xs text-text-muted" title={REGISTER_SCORE_COPY.songRatingLabel}>
      {REGISTER_SCORE_COPY.ratingLabel}
    </dt>
    <dd class="text-right font-oswald">
      {props.metrics ? formatRatingFixed2(props.metrics.singleRating) : REGISTER_SCORE_NO_DATA_TEXT}
    </dd>
    <dt class="font-sans text-xs text-text-muted">{REGISTER_SCORE_COPY.songOverPowerLabel}</dt>
    <dd class="text-right font-oswald">
      {props.metrics ? formatOverPowerValue(props.metrics.overPower) : REGISTER_SCORE_NO_DATA_TEXT}
    </dd>
    <Show when={REGISTER_SCORE_SHOW_SONG_OP_PERCENT}>
      <dt
        class="font-sans text-xs text-text-muted"
        title={REGISTER_SCORE_COPY.overPowerPercentAccessibleLabel}
      >
        {REGISTER_SCORE_COPY.overPowerPercentLabel}
      </dt>
      <dd class="text-right font-oswald">
        {props.metrics
          ? `${formatOverPowerPercent(props.metrics.overPowerPercent)}%`
          : REGISTER_SCORE_NO_DATA_TEXT}
      </dd>
    </Show>
  </dl>
)

/**
 * 1譜面分の登録差分をカード表示にする。曲名をクリックするとクリップボードへコピーする。
 *
 * @param props - 表示対象の差分、楽曲タイトル、譜面レベル、単曲メトリクス、画像除外状態、変更ハンドラー。
 * @returns 楽曲差分カード。
 */
export const RegisterScoreSongChangeCard = (props: {
  change: PlayerDataSongRecordChange
  songTitle: string
  chartLevel?: string
  metrics: RegisterScoreSongMetricChange | null
  excludedFromImage: boolean
  onExcludedFromImageChange: (excluded: boolean) => void
}) => {
  const metrics = createMemo(() => props.metrics)
  const [isCopyHighlighted, setIsCopyHighlighted] = createSignal(false)
  let copyHighlightTimerId: number | undefined

  /**
   * 曲名をコピーし、成功時に曲名を一時的にアクセントカラーへ変更する。
   *
   * @returns コピー処理の完了時に解決されるPromise。
   */
  const handleCopySongTitle = async (): Promise<void> => {
    const copied = await copyRegisterScoreSongTitle(props.songTitle)
    if (!copied) return

    if (copyHighlightTimerId !== undefined) {
      window.clearTimeout(copyHighlightTimerId)
    }

    setIsCopyHighlighted(true)
    copyHighlightTimerId = window.setTimeout(() => {
      setIsCopyHighlighted(false)
      copyHighlightTimerId = undefined
    }, REGISTER_SCORE_COPY_HIGHLIGHT_MS)
  }

  onCleanup(() => {
    if (copyHighlightTimerId !== undefined) {
      window.clearTimeout(copyHighlightTimerId)
    }
  })

  return (
    <article
      class={`${SCORE_CHANGE_CARD_CLASS} relative font-jost`}
      data-image-capture-excluded={props.excludedFromImage ? 'true' : undefined}
    >
      <div
        class={`transition-opacity motion-reduce:transition-none ${
          props.excludedFromImage ? 'opacity-40' : 'opacity-100'
        }`}
      >
        <div class="flex min-w-0 items-center gap-2 pr-10 text-base">
          <span
            class={`${DIFFICULTY_BADGE_LAYOUT_CLASS} ${getRegisterScoreDifficultyBadgeClass(props.change)}`}
          >
            {getRegisterScoreShortDifficultyLabel(props.change)}
          </span>
          <Show when={props.chartLevel}>
            {(level) => (
              <span class="shrink-0 whitespace-nowrap rounded bg-surface px-2 py-0.5 text-xs font-bold leading-5">
                {level()}
              </span>
            )}
          </Show>
          <h3 class="min-w-0 flex-1">
            <Button
              class={`flex w-fit min-w-0 max-w-full items-center gap-1 border-0 bg-transparent p-0 text-left font-sans text-base font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 image-capture:block image-capture:w-full image-capture:truncate ${
                isCopyHighlighted()
                  ? 'text-action-primary transition-none'
                  : 'text-text transition-colors duration-700'
              }`}
              aria-label={REGISTER_SCORE_COPY.copySongTitleLabel(props.songTitle)}
              title={props.songTitle}
              onClick={handleCopySongTitle}
            >
              <span class="min-w-0 truncate image-capture:inline image-capture:overflow-visible image-capture:text-clip">
                {props.songTitle}
              </span>
              <Copy
                class="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
                data-image-capture-excluded="true"
              />
            </Button>
          </h3>
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
            <Show when={REGISTER_SCORE_SHOW_SONG_METRICS && metrics()}>
              <RegisterScoreSongMetricValues metrics={metrics()?.before ?? null} />
            </Show>
          </div>
          <div
            class="flex w-20 flex-col items-center gap-1"
            classList={{ 'self-start': REGISTER_SCORE_SHOW_SONG_METRICS && metrics() !== null }}
          >
            <RegisterScoreChangeDelta change={props.change} />
          </div>
          <div class="w-fit">
            <span class="font-jost font-semibold">{formatInteger(props.change.after.score)}</span>
            <RecordLampBadges state={props.change.after} />
            <Show when={REGISTER_SCORE_SHOW_SONG_METRICS && metrics()}>
              <RegisterScoreSongMetricValues metrics={metrics()?.after ?? null} />
            </Show>
          </div>
        </div>
      </div>
      <RegisterScoreImageExclusionButton
        excludedFromImage={props.excludedFromImage}
        onChange={props.onExcludedFromImageChange}
      />
    </article>
  )
}

/**
 * 1コース分の登録差分を、コース固有の状態だけでカード表示にする。
 *
 * @param props - 表示対象のコース差分、コースタイトル、画像除外状態、変更ハンドラー。
 * @returns コース差分カード。
 */
export const RegisterScoreCourseChangeCard = (props: {
  change: PlayerDataCourseRecordChange
  courseTitle: string
  excludedFromImage: boolean
  onExcludedFromImageChange: (excluded: boolean) => void
}) => (
  <article
    class={`${SCORE_CHANGE_CARD_CLASS} relative font-jost`}
    data-image-capture-excluded={props.excludedFromImage ? 'true' : undefined}
  >
    <div
      class={`transition-opacity motion-reduce:transition-none ${
        props.excludedFromImage ? 'opacity-40' : 'opacity-100'
      }`}
    >
      <div class="flex min-w-0 items-center gap-2 pr-10 text-base">
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
          <RegisterScoreChangeDelta change={props.change} />
        </div>
        <div class={COURSE_CHANGE_SCORE_VALUE_CLASS}>
          <span class="font-jost font-semibold">{formatInteger(props.change.after.score)}</span>
          <CourseRecordLampBadges state={props.change.after} />
        </div>
      </div>
    </div>
    <RegisterScoreImageExclusionButton
      excludedFromImage={props.excludedFromImage}
      onChange={props.onExcludedFromImageChange}
    />
  </article>
)

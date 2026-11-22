import { A } from '@solidjs/router'
import CircleQuestionMark from 'lucide-solid/icons/circle-question-mark'
import { createMemo, createSignal, For, Show } from 'solid-js'
import placeholderImageUrl from '../../../../assets/placeholder.webp'
import { LoadError, Loading } from '../../../../components'
import { AppButton } from '../../../../components/common/AppButton'
import { AppDialog } from '../../../../components/common/AppDialog'
import { CourseChartDifficultyBadge } from '../../../../components/common/course/CourseChartDifficultyBadge'
import { JacketImage } from '../../../../components/common/JacketImage'
import { DefaultRecordLampBadges } from '../../../../components/common/record/RecordDisplayParts'
import { SongSelectionVirtualList } from '../../../../components/common/songSelection/SongSelectionDialogBase'
import { SCORE_THEORETICAL_MAX } from '../../../../constants/chart'
import {
  COURSE_TRACK_NUMBERS,
  COURSE_TRACK_SELECTION_LABELS,
} from '../../../../constants/courseTracks'
import type { CourseDetailDTO, CourseTrackCandidateDTO } from '../../../../types/api'
import { toChartLevelLabel } from '../../../../utils/chartLevel'
import {
  type CourseTrackBestRecord,
  courseChartKey,
  formatCourseTrackFilter,
  formatCourseWorldsendChart,
  getCourseTrackSongPath,
} from '../../../../utils/courseTracks'
import { buildChunithmJacketUrl } from '../../../../utils/jacket'
import { COURSE_PAGE_COPY } from '../../constants'

type Track = CourseDetailDTO['tracks'][number]

type Props = {
  tracks: readonly Track[]
  loading: boolean
  error: unknown
  records?: ReadonlyMap<string, CourseTrackBestRecord>
  scoreError: boolean
}

const COPY = COURSE_PAGE_COPY.tracks

/** コース楽曲カードの共通外枠クラス */
const TRACK_CARD_SURFACE_CLASS =
  'flex h-full min-w-0 flex-col gap-3 rounded-lg border border-border bg-surface p-3.5'

/** 楽曲詳細へ遷移する固定譜面カード用のインタラクティブクラス */
const TRACK_CARD_LINK_CLASS = `${TRACK_CARD_SURFACE_CLASS} transition-colors hover:border-action-primary/60 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring`

/**
 * 譜面定数またはWORLD'S ENDの譜面表記を返す。
 *
 * @param chart - 表示対象の候補譜面。
 * @returns 譜面定数、またはWORLD'S ENDの譜面情報。
 */
const formatChartMetaLabel = (chart: CourseTrackCandidateDTO): string => {
  // コース詳細では属性と星数だけで足りるため、ノーツ数は表示しない
  if (chart.difficulty === 'WORLDSEND') return formatCourseWorldsendChart({ ...chart, notes: null })
  return chart.is_const_unknown ? `Lv.${toChartLevelLabel(chart.const)}` : chart.const.toFixed(1)
}

/**
 * 難易度バッジと譜面定数（またはWORLD'S END表記）を横並びで表示する。
 *
 * @param props - 表示対象の候補譜面。
 * @returns 難易度と譜面定数の表示。
 */
const TrackChartMeta = (props: { chart: CourseTrackCandidateDTO }) => (
  <div class="flex flex-wrap items-center justify-end gap-1.5">
    <CourseChartDifficultyBadge difficulty={props.chart.difficulty} />
    <span
      class={
        props.chart.difficulty === 'WORLDSEND'
          ? 'font-sans text-xs text-text-muted'
          : 'font-jost text-sm font-medium leading-none text-text tabular-nums'
      }
    >
      {formatChartMetaLabel(props.chart)}
    </span>
  </div>
)

/**
 * 自己ベストスコアと、その下にランプバッジを右揃えで表示する。
 *
 * @param props - 取得済みレコードとスコアの文字サイズクラス。
 * @returns スコアとランプバッジの縦積み表示。
 */
const OwnBestScore = (props: { record: CourseTrackBestRecord; scoreClass: string }) => (
  <div class="flex shrink-0 flex-col items-end gap-1.5">
    <span class={`font-jost font-semibold leading-none text-text tabular-nums ${props.scoreClass}`}>
      <span class="sr-only">{COPY.ownBest} </span>
      {props.record.score.toLocaleString('ja-JP')}
    </span>
    <DefaultRecordLampBadges record={props.record} />
  </div>
)

/**
 * 譜面の自己ベストスコアとランプバッジ（または未プレイ）を表示する。
 *
 * @param props - 取得済みレコード。
 * @returns スコアとランプバッジの表示。
 */
const TrackOwnBest = (props: { record?: CourseTrackBestRecord }) => (
  <Show
    when={props.record}
    fallback={
      <div class="flex justify-end @md:shrink-0">
        <span class="text-xs text-text-muted">{COURSE_PAGE_COPY.notPlayed}</span>
      </div>
    }
  >
    {(record) => <OwnBestScore record={record()} scoreClass="text-xl" />}
  </Show>
)

/**
 * 候補譜面ダイアログ内の1件分のリンク行を表示する。
 *
 * @param props - 候補譜面と取得済みレコード。
 * @returns 候補1件の表示。
 */
const CandidateRow = (props: {
  chart: CourseTrackCandidateDTO
  records?: ReadonlyMap<string, CourseTrackBestRecord>
}) => (
  <A
    href={getCourseTrackSongPath(props.chart)}
    class="flex min-w-0 items-center gap-3.5 rounded-md px-2 py-2.5 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
  >
    <JacketImage
      source={buildChunithmJacketUrl(props.chart.jacket) ?? undefined}
      alt=""
      ariaHidden
      class="size-14 shrink-0 overflow-hidden rounded-md bg-surface-muted ring-1 ring-border/50"
      imageClass="size-full object-cover"
      fallback={<img src={placeholderImageUrl} alt="" class="size-full object-cover" />}
    />
    <div class="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div class="min-w-0 space-y-1">
        <span class="block break-words font-sans text-sm font-semibold leading-snug text-action-primary">
          {props.chart.title}
        </span>
        <div class="flex flex-wrap items-center gap-1.5">
          <CourseChartDifficultyBadge difficulty={props.chart.difficulty} />
          <span
            class={
              props.chart.difficulty === 'WORLDSEND'
                ? 'font-sans text-xs text-text-muted'
                : 'font-jost text-xs font-medium text-text-muted tabular-nums'
            }
          >
            {formatChartMetaLabel(props.chart)}
          </span>
        </div>
      </div>
      <Show when={props.records}>
        {(records) => {
          const record = () => records().get(courseChartKey(props.chart))
          return (
            <Show
              when={record()}
              fallback={
                <span class="text-xs text-text-muted sm:shrink-0">
                  {COURSE_PAGE_COPY.notPlayed}
                </span>
              }
            >
              {(best) => <OwnBestScore record={best()} scoreClass="text-base" />}
            </Show>
          )
        }}
      </Show>
    </div>
  </A>
)

/**
 * 候補譜面をスクロール領域内で仮想化して表示する。
 * スクロール要素は描画ごとに持ち、ドキュメントへ挿入されてから仮想化を始める。
 *
 * @param props - 候補譜面と取得済みレコード。
 * @returns 候補譜面のスクロール一覧。
 */
const CandidateVirtualList = (props: {
  candidates: readonly CourseTrackCandidateDTO[]
  records?: ReadonlyMap<string, CourseTrackBestRecord>
}) => {
  const [scrollElement, setScrollElement] = createSignal<HTMLDivElement>()
  return (
    <div
      // ポータル挿入前の要素では仮想化が画面のサイズとスクロールを監視できないため、挿入後に渡す
      ref={(element) => queueMicrotask(() => setScrollElement(element))}
      class="mt-4 min-h-0 flex-1 basis-0 overflow-y-auto overscroll-contain scrollbar-none"
    >
      <Show when={scrollElement()}>
        {(element) => (
          <SongSelectionVirtualList
            items={props.candidates}
            getScrollElement={element}
            renderItem={(candidate) => (
              <div class="py-0.5">
                <CandidateRow chart={candidate} records={props.records} />
              </div>
            )}
          />
        )}
      </Show>
    </div>
  )
}

/**
 * コース楽曲カード上部のトラック番号とメタ情報ヘッダーを表示する。
 *
 * @param props - トラック番号、トラック定義、固定譜面。
 * @returns カードヘッダー。
 */
const TrackCardHeader = (props: {
  number: number
  track?: Track
  fixedChart?: CourseTrackCandidateDTO
}) => (
  <div class="flex min-h-6 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-border/60 pb-2">
    <span class="font-oswald text-xs font-semibold tracking-wider text-text-subtle">
      {COPY.trackPrefix} {props.number}
    </span>
    <Show
      when={props.track}
      fallback={<span class="text-xs text-text-muted">{COPY.unregistered}</span>}
    >
      {(track) => (
        <Show
          when={track().selection_type === 'FIXED'}
          fallback={
            <span class="font-sans text-xs font-medium text-text-muted">
              {COURSE_TRACK_SELECTION_LABELS[track().selection_type]}
            </span>
          }
        >
          <Show when={props.fixedChart}>{(chart) => <TrackChartMeta chart={chart()} />}</Show>
        </Show>
      )}
    </Show>
  </div>
)

/**
 * 選曲方式と候補を表示する。
 * 固定譜面カードはカード全体を楽曲詳細へのリンクとし、ランダム枠の候補はダイアログ内で仮想スクロール表示する。
 *
 * @param props - トラック番号、取得済みのトラック定義と自己ベストレコード。
 * @returns コースの1枠分のカード。
 */
const CourseTrackCard = (props: {
  number: number
  track?: Track
  records?: ReadonlyMap<string, CourseTrackBestRecord>
}) => {
  const [dialogOpen, setDialogOpen] = createSignal(false)
  const unavailable = createMemo(() => {
    const track = props.track
    if (!track || track.selection_type === 'RANDOM_FILTER') return []
    const candidateKeys = new Set(track.candidates.map(courseChartKey))
    return track.charts.filter((chart) => !candidateKeys.has(courseChartKey(chart)))
  })

  /** @returns 固定枠で先頭候補が取得できている場合の譜面。 */
  const fixedChart = createMemo(() => {
    const track = props.track
    if (track?.selection_type !== 'FIXED') return undefined
    return track.candidates[0]
  })

  /** @returns 条件指定でランダム選曲する場合の条件表示。 */
  const conditionCaption = () => {
    const track = props.track
    if (track?.selection_type === 'RANDOM_FILTER') return formatCourseTrackFilter(track.filter)
    return undefined
  }

  const unavailableBox = () => (
    <Show when={unavailable().length}>
      <div class="space-y-1 rounded border border-border bg-surface-muted p-2">
        <p class="text-xs text-text-muted">{COPY.unavailableChart}</p>
        <ul class="space-y-1">
          <For each={unavailable()}>
            {(chart) => (
              <li class="flex flex-wrap items-center gap-1.5">
                <CourseChartDifficultyBadge difficulty={chart.difficulty} />
                <span class="break-all font-mono text-xs text-text-muted">{chart.id}</span>
              </li>
            )}
          </For>
        </ul>
      </div>
    </Show>
  )

  return (
    <li class="flex min-w-0 flex-col gap-2">
      <Show
        when={fixedChart()}
        fallback={
          <div class={TRACK_CARD_SURFACE_CLASS}>
            <TrackCardHeader number={props.number} track={props.track} />
            <Show when={props.track}>
              {(track) => (
                <>
                  <Show
                    when={track().selection_type === 'FIXED'}
                    fallback={
                      <Show
                        when={
                          conditionCaption() ||
                          track().candidates.length > 0 ||
                          unavailable().length === 0
                        }
                      >
                        <div class="flex min-w-0 flex-1 items-center gap-3.5">
                          <div
                            aria-hidden="true"
                            class="flex size-20 shrink-0 items-center justify-center rounded-md border border-border bg-surface-muted text-text-muted"
                          >
                            <CircleQuestionMark class="size-9" />
                          </div>
                          <div class="flex min-w-0 flex-1 flex-col gap-2 @md:flex-row @md:items-center @md:justify-between @md:gap-4 @4xl:flex-col @4xl:items-stretch @4xl:gap-2">
                            <Show
                              when={
                                conditionCaption() ||
                                (track().candidates.length === 0 && unavailable().length === 0)
                              }
                            >
                              <div class="min-w-0 space-y-1">
                                <Show when={conditionCaption()}>
                                  {(caption) => (
                                    <p class="break-words font-sans text-xs text-text-muted">
                                      {caption()}
                                    </p>
                                  )}
                                </Show>
                                <Show
                                  when={
                                    track().candidates.length === 0 && unavailable().length === 0
                                  }
                                >
                                  <p class="text-xs text-text-muted">{COPY.noCandidates}</p>
                                </Show>
                              </div>
                            </Show>
                            <Show when={track().candidates.length > 0}>
                              <div class="shrink-0">
                                <AppButton
                                  variant="surface"
                                  size="sm"
                                  onClick={() => setDialogOpen(true)}
                                >
                                  {COPY.candidates}{' '}
                                  {track().candidates.length.toLocaleString('ja-JP')}件
                                </AppButton>
                              </div>
                              <AppDialog
                                open={dialogOpen()}
                                onOpenChange={setDialogOpen}
                                height="fill90"
                                title={`${COPY.trackPrefix} ${props.number} ${COPY.candidates}`}
                                closeLabel={COPY.closeCandidates}
                              >
                                <CandidateVirtualList
                                  candidates={track().candidates}
                                  records={props.records}
                                />
                              </AppDialog>
                            </Show>
                          </div>
                        </div>
                      </Show>
                    }
                  >
                    <Show when={unavailable().length === 0}>
                      <p class="text-sm text-text-muted">{COPY.noCandidates}</p>
                    </Show>
                  </Show>
                  {unavailableBox()}
                </>
              )}
            </Show>
          </div>
        }
      >
        {(chart) => (
          <>
            <A href={getCourseTrackSongPath(chart())} class={TRACK_CARD_LINK_CLASS}>
              <TrackCardHeader number={props.number} track={props.track} fixedChart={chart()} />
              <div class="flex min-w-0 flex-1 items-center gap-3.5">
                <JacketImage
                  source={buildChunithmJacketUrl(chart().jacket) ?? undefined}
                  alt=""
                  ariaHidden
                  class="size-20 shrink-0 overflow-hidden rounded-md bg-surface-muted ring-1 ring-border/50"
                  imageClass="size-full object-cover"
                  fallback={<img src={placeholderImageUrl} alt="" class="size-full object-cover" />}
                />
                <div class="flex min-w-0 flex-1 flex-col gap-2 @md:flex-row @md:items-center @md:justify-between @md:gap-4 @4xl:flex-col @4xl:items-stretch @4xl:gap-2">
                  <span class="block min-w-0 break-words font-sans text-sm font-semibold leading-snug text-action-primary">
                    {chart().title}
                  </span>
                  <Show when={props.records}>
                    {(records) => <TrackOwnBest record={records().get(courseChartKey(chart()))} />}
                  </Show>
                </div>
              </div>
            </A>
            {unavailableBox()}
          </>
        )}
      </Show>
    </li>
  )
}

/**
 * コースを構成する3枠と現在選曲できる譜面を表示する。
 * コンテナ幅が十分な場合は3列、狭い場合は縦1列で配置する。
 *
 * @param props - コース詳細の取得状態と比較用の自己ベストレコード。
 * @returns コース楽曲セクション。
 */
const CourseTracksSection = (props: Props) => (
  <section aria-label={COPY.heading} class="@container">
    <h2 class="mb-3 text-lg font-semibold">{COPY.heading}</h2>
    <Show
      when={!props.loading}
      fallback={
        <div class="min-h-12">
          <Loading size="inline" />
        </div>
      }
    >
      <Show when={!props.error} fallback={<LoadError error={props.error} />}>
        <Show when={props.scoreError}>
          <p class="mb-2 text-xs text-text-muted">{COPY.bestLoadError}</p>
        </Show>
        <ol class="grid grid-cols-1 gap-3 @4xl:grid-cols-3">
          <For each={COURSE_TRACK_NUMBERS}>
            {(number) => (
              <CourseTrackCard
                number={number}
                track={props.tracks.find((track) => track.track_no === number)}
                records={props.records}
              />
            )}
          </For>
        </ol>
        <Show
          when={COURSE_TRACK_NUMBERS.every(
            (number) =>
              props.tracks.find((track) => track.track_no === number)?.selection_type === 'FIXED'
          )}
        >
          <p class="mt-3 flex items-baseline justify-end gap-2">
            <span class="text-xs text-text-muted">{COPY.theoreticalMax}</span>
            <span class="font-jost text-lg font-semibold leading-none text-text tabular-nums">
              {(SCORE_THEORETICAL_MAX * COURSE_TRACK_NUMBERS.length).toLocaleString('ja-JP')}
            </span>
          </p>
        </Show>
      </Show>
    </Show>
  </section>
)

export default CourseTracksSection

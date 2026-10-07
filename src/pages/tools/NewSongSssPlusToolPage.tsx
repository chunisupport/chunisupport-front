import { Collapsible } from '@kobalte/core/collapsible'
import { A } from '@solidjs/router'
import { Gauge, TrendingUp, TriangleAlert } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createMemo, createResource, For, Show } from 'solid-js'
import { LoadError, Loading } from '../../components'
import { AppDisclosureTrigger } from '../../components/common/AppDisclosureTrigger'
import { AppTabContent, SegmentedTabs } from '../../components/common/AppTabs'
import { RecordDifficultyBadge } from '../../components/common/record/RecordBadges'
import { SCORE_RANK_TEXT_CLASS } from '../../components/common/record/recordStyleClasses'
import { buildSongDetailPath, RATING_THEORETICAL_CHECKER_PATH } from '../../constants/routes'
import { getToolLink } from '../../constants/tools'
import { createHistoryViewState } from '../../hooks/createHistoryViewState'
import { useAppMainScrollRestoration } from '../../hooks/useAppMainScrollRestoration'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useRatingTheoretical } from '../../hooks/useNewSongTheoreticalRating'
import { authSession } from '../../stores/authSession'
import type { PlayerRecordDTO } from '../../types/api'
import { fetchUserRatingWithCache } from '../../usecases/cache/fetchUserRatingWithCache'
import { fetchUserRecordWithCache } from '../../usecases/cache/fetchUserRecordWithCache'
import { formatChartConst } from '../../utils/chartConstFormat'
import type {
  RatingTheoretical,
  RatingTheoreticalEntry,
} from '../../utils/newSongTheoreticalRating'
import {
  calculateRatingTheoreticalGap,
  prioritizeBoundaryEntries,
  resolveRatingTheoreticalProgress,
} from '../../utils/newSongTheoreticalRating'
import { formatInteger } from '../../utils/numberFormat'
import { formatPlayerRating, formatRatingFixed2 } from '../../utils/ratingFormat'
import { formatScoreDifference } from '../../utils/scoreDifference'
import { getScoreRank, type ScoreRank } from '../../utils/scoreRank'
import { NEW_SONG_SSS_PLUS_COPY, RATING_THEORETICAL_TAB_OPTIONS } from './newSongSssPlus.constants'

/** ベスト枠・新曲枠理論値チェッカーで選択できる表示枠 */
type RatingTheoreticalFrame = (typeof RATING_THEORETICAL_TAB_OPTIONS)[number]['value']

/** 履歴で戻った際に選択中の表示枠を復元する Primitive */
const useSelectedFrameState = createHistoryViewState<RatingTheoreticalFrame>()

/** 理論値サマリーの1区画に表示する枠の計算結果と取得状態 */
type RatingTheoreticalFigureProps = {
  /** 区画の見出し */
  label: string
  /** 見出しの前に表示する装飾アイコン */
  icon?: JSX.Element
  /** 総合理論値として大きく表示するか */
  primary?: boolean
  /** 配置や区切り線を指定する追加クラス */
  class?: string
  /** 現在の平均レーティング。未計算の場合はnull */
  currentRating: number | null
  /** データ取得で発生したエラー。正常時は未定義 */
  error: unknown
  /** 現在データを取得または理論値を計算しているか */
  loading: boolean
  /** 計算済みの理論値。対象譜面がない場合は未定義 */
  theoreticalRating: RatingTheoretical | undefined
}

/** 枠ごとの理論値対象譜面一覧に表示する計算結果、現在レコード、取得状態 */
type RatingTheoreticalChartsProps = {
  /** 理論値対象譜面との照合に使う全通常譜面レコード */
  records: readonly PlayerRecordDTO[]
  /** 理論値対象譜面一覧の見出し */
  detailsLabel: string
  /** データ取得で発生したエラー。正常時は未定義 */
  error: unknown
  /** 現在データを取得または理論値を計算しているか */
  loading: boolean
  /** 計算済みの枠理論値。対象譜面がない場合は未定義 */
  theoreticalRating: RatingTheoretical | undefined
}

/** 理論値対象譜面の現在スコア表示 */
type ChartProgressDisplay = {
  /** 譜面の現在スコア */
  currentScore: number
  /** 現在スコアのランク */
  scoreRank: ScoreRank
  /** SSS+ボーダーとの差。到達済みならnull */
  scoreGap: number | null
}

/**
 * 理論値と現在値からの差を表示する。推定値の場合は未確定マーカーを付けて強調する。
 *
 * @param props - 見出し、表示サイズ、現在値、理論値、取得状態。
 * @returns 理論値サマリーの1区画。
 */
const RatingTheoreticalFigure: Component<RatingTheoreticalFigureProps> = (props) => {
  /**
   * 理論値と現在値の差を表示用に整形する。
   *
   * @param theoreticalRating - 計算済みの理論値。
   * @returns 整形済みの差。現在値がなければ空表示。
   */
  const formatRatingGap = (theoreticalRating: RatingTheoretical) => {
    const gap = calculateRatingTheoreticalGap(theoreticalRating.rating, props.currentRating)
    return gap === undefined ? NEW_SONG_SSS_PLUS_COPY.emptyValue : formatPlayerRating(gap)
  }

  return (
    <div
      class={`flex min-w-0 flex-col items-center justify-center gap-0.5 px-3 py-2 text-center ${props.class ?? ''}`}
    >
      <p class="flex items-center gap-1.5 whitespace-nowrap font-sans text-xs font-medium text-text-muted">
        {props.icon}
        {props.label}
      </p>
      <Show when={!props.error} fallback={<LoadError error={props.error} />}>
        <Show
          when={!props.loading}
          fallback={
            <div class="h-8 w-full">
              <Loading size="inline" ariaLabel={NEW_SONG_SSS_PLUS_COPY.loadingLabel} />
            </div>
          }
        >
          <Show
            when={props.theoreticalRating}
            fallback={
              <p class="font-sans text-sm text-text-subtle">{NEW_SONG_SSS_PLUS_COPY.noData}</p>
            }
          >
            {(theoreticalRating) => (
              <div class="flex flex-wrap items-baseline justify-center gap-x-2">
                <p
                  class="font-jost font-bold tabular-nums text-text data-[unknown=true]:italic data-[unknown=true]:text-danger"
                  classList={{ 'text-3xl': props.primary, 'text-xl': !props.primary }}
                  data-unknown={theoreticalRating().hasUnknownChartConstants}
                >
                  {formatPlayerRating(theoreticalRating().rating)}
                  <Show when={theoreticalRating().hasUnknownChartConstants}>
                    <sup
                      class="ml-0.5 align-super font-sans text-[0.55em]"
                      title={NEW_SONG_SSS_PLUS_COPY.unknownChartConstant}
                      aria-hidden="true"
                    >
                      {NEW_SONG_SSS_PLUS_COPY.unknownMarker}
                    </sup>
                    <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.unknownChartConstant}</span>
                  </Show>
                </p>
                <p
                  class="flex items-baseline gap-1 font-jost font-medium tabular-nums text-text-muted"
                  classList={{ 'text-base': props.primary, 'text-sm': !props.primary }}
                  title={NEW_SONG_SSS_PLUS_COPY.currentGap}
                >
                  <TrendingUp class="h-4 w-4 shrink-0 self-center" aria-hidden="true" />
                  <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.currentGap}</span>
                  {formatRatingGap(theoreticalRating())}
                </p>
              </div>
            )}
          </Show>
        </Show>
      </Show>
    </div>
  )
}

/**
 * SSS+対象譜面の現在スコアをランク色、SSS+ボーダーとの差を差分色で表示する。
 *
 * @param props - 現在スコア表示。レコードがなければ未定義。
 * @returns 現在スコアとSSS+ボーダーとの差。
 */
const SssPlusChartProgress: Component<{
  progress: ChartProgressDisplay | undefined
}> = (props) => (
  <span class="flex min-w-0 flex-wrap items-center justify-end gap-x-1 gap-y-0.5 font-oswald text-xs tabular-nums text-text-muted sm:gap-x-3">
    <Show
      when={props.progress}
      keyed
      fallback={
        <span class="font-sans text-text-subtle">{NEW_SONG_SSS_PLUS_COPY.recordUnavailable}</span>
      }
    >
      {(current) => (
        <>
          <span
            class={`whitespace-nowrap font-semibold ${SCORE_RANK_TEXT_CLASS[current.scoreRank]}`}
          >
            <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.currentScoreLabel}</span>
            {formatInteger(current.currentScore)}
          </span>
          <Show when={current.scoreGap !== null}>
            <span class="whitespace-nowrap font-medium text-rating-candidate-gap">
              <span class="sr-only font-sans text-text-muted sm:not-sr-only sm:mr-1">
                {NEW_SONG_SSS_PLUS_COPY.scoreGapLabel}
              </span>
              <span class="sm:hidden" aria-hidden="true">
                (
              </span>
              {formatScoreDifference(current.scoreGap ?? 0)}
              <span class="sm:hidden" aria-hidden="true">
                )
              </span>
            </span>
          </Show>
        </>
      )}
    </Show>
  </span>
)

/**
 * 理論値対象譜面の現在スコア表示を組み立てる。
 *
 * @param entry - 理論値対象譜面。
 * @param records - 照合に使う全通常譜面レコード。
 * @returns 現在スコア表示。レコードがなければ未定義。
 */
const resolveChartProgressDisplay = (
  entry: RatingTheoreticalEntry,
  records: readonly PlayerRecordDTO[]
): ChartProgressDisplay | undefined => {
  const resolved = resolveRatingTheoreticalProgress(entry, records, [])
  if (resolved.slot === null || resolved.currentScore === null) {
    return undefined
  }
  return {
    currentScore: resolved.currentScore,
    scoreRank: getScoreRank(resolved.currentScore),
    scoreGap: resolved.scoreGap,
  }
}

/**
 * 理論値対象譜面のレコードがSSS+に到達しているか判定する。
 *
 * @param entry - 理論値対象譜面。
 * @param records - 照合に使う全通常譜面レコード。
 * @returns SSS+到達済みならtrue。
 */
const isSssPlusAchievedEntry = (
  entry: RatingTheoreticalEntry,
  records: readonly PlayerRecordDTO[]
): boolean => resolveChartProgressDisplay(entry, records)?.scoreRank === 'SSS+'

/**
 * 理論値対象譜面の1行を表示する。SSS+達成済みなら背景をハイライトする。
 *
 * @param props - 対象譜面、表示順位、全通常譜面レコード。
 * @returns 楽曲詳細へ遷移できる一覧行。
 */
const TheoreticalChartRow: Component<{
  entry: RatingTheoreticalEntry
  rank: number
  records: readonly PlayerRecordDTO[]
}> = (props) => {
  const progress = createMemo(() => resolveChartProgressDisplay(props.entry, props.records))
  const isSssPlusAchieved = () => progress()?.scoreRank === 'SSS+'

  return (
    <li>
      <A
        href={buildSongDetailPath(props.entry.songId, props.entry.difficulty)}
        class="grid grid-cols-[2rem_1.75rem_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset"
        classList={{
          'bg-row-highlight hover:bg-row-highlight-hover': isSssPlusAchieved(),
          'hover:bg-surface-hover': !isSssPlusAchieved(),
        }}
      >
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted font-oswald text-lg font-bold text-text-muted">
          {props.rank}
        </span>
        <RecordDifficultyBadge difficulty={props.entry.difficulty} />
        <span class="min-w-0 font-sans">
          <span class="block truncate text-sm font-semibold text-text">{props.entry.title}</span>
          <span class="block truncate text-xs text-text-muted">{props.entry.artist}</span>
          <Show when={isSssPlusAchieved()}>
            <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.sssPlusAchievedLabel}</span>
          </Show>
        </span>
        <span class="flex shrink-0 flex-col items-end gap-0.5 text-right">
          <span class="font-oswald tabular-nums">
            <span class="block text-base font-bold text-text">
              <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.singleRatingLabel}</span>
              {formatRatingFixed2(props.entry.rating)}
            </span>
            <span
              class="block text-xs text-text-muted data-[unknown=true]:italic data-[unknown=true]:text-danger"
              data-unknown={props.entry.isChartConstantUnknown}
            >
              <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.chartConstantLabel}</span>
              {formatChartConst(props.entry.chartConstant)}
              <Show when={props.entry.isChartConstantUnknown}>
                <sup
                  class="ml-0.5 align-super font-sans text-[0.65em]"
                  title={NEW_SONG_SSS_PLUS_COPY.unknownChartConstant}
                  aria-hidden="true"
                >
                  {NEW_SONG_SSS_PLUS_COPY.unknownMarker}
                </sup>
                <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.unknownChartConstant}</span>
              </Show>
            </span>
          </span>
          <SssPlusChartProgress progress={progress()} />
        </span>
      </A>
    </li>
  )
}

/**
 * 全譜面SSS+時にレーティング枠へ採用される譜面を単曲レーティング順に表示する。
 *
 * @param props - 一覧見出し、SSS+時に採用される譜面一覧、全通常譜面レコード。
 * @returns 楽曲詳細へ遷移できる常時表示の一覧。
 */
const TheoreticalChartList: Component<{
  detailsLabel: string
  entries: RatingTheoretical['entries']
  records: readonly PlayerRecordDTO[]
}> = (props) => (
  <section aria-label={props.detailsLabel}>
    <div class="flex items-center justify-between px-3 py-2 font-sans">
      <h2 class="text-sm font-semibold text-text">{props.detailsLabel}</h2>
      <span class="text-xs text-text-muted">
        {props.entries.length}
        {NEW_SONG_SSS_PLUS_COPY.chartCountSuffix}
      </span>
    </div>
    <ol class="divide-y divide-border border-t border-border">
      <For each={props.entries}>
        {(entry, index) => (
          <TheoreticalChartRow entry={entry} rank={index() + 1} records={props.records} />
        )}
      </For>
    </ol>
  </section>
)

/**
 * 下限定数で規定枠数から溢れた譜面を、既定で折りたたまれた独立カードに表示する。
 *
 * @param props - 下限定数の枠外譜面一覧、全行に表示する下限順位、全通常譜面レコード。
 * @returns 開閉できる枠外譜面一覧のカード。
 */
const BoundaryChartList: Component<{
  entries: RatingTheoretical['boundaryEntries']
  rank: number
  records: readonly PlayerRecordDTO[]
}> = (props) => (
  <Collapsible class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
    <AppDisclosureTrigger
      class="py-2 font-sans focus-visible:ring-inset"
      label={NEW_SONG_SSS_PLUS_COPY.boundaryDetailsLabel}
      labelClass="font-semibold text-text"
      summary={`${props.entries.length}${NEW_SONG_SSS_PLUS_COPY.chartCountSuffix}`}
    />
    <Collapsible.Content>
      <ol
        class="divide-y divide-border border-t border-border"
        aria-label={NEW_SONG_SSS_PLUS_COPY.boundaryDetailsLabel}
      >
        <For each={props.entries}>
          {(entry) => (
            <TheoreticalChartRow entry={entry} rank={props.rank} records={props.records} />
          )}
        </For>
      </ol>
    </Collapsible.Content>
  </Collapsible>
)

/**
 * レーティング枠の全譜面SSS+時に採用される譜面一覧を表示する。
 *
 * 下限定数の譜面をSSS+達成済み優先で並べ替え、枠外譜面を別カードに表示する。
 *
 * @param props - 一覧見出し、SSS+時レーティング、現在レコード、楽曲データの取得状態。
 * @returns 理論値対象譜面一覧のカードと、下限定数の枠外譜面カード。
 */
const RatingTheoreticalCharts: Component<RatingTheoreticalChartsProps> = (props) => {
  /** 下限定数の譜面をSSS+達成済み優先で振り分けた採用譜面と枠外譜面 */
  const prioritized = createMemo(() =>
    props.theoreticalRating
      ? prioritizeBoundaryEntries(props.theoreticalRating, (entry) =>
          isSssPlusAchievedEntry(entry, props.records)
        )
      : undefined
  )
  /** 取得完了後に表示する下限定数の枠外譜面 */
  const boundaryEntries = () =>
    !props.error && !props.loading ? prioritized()?.boundaryEntries : undefined

  return (
    <div class="flex flex-col gap-3">
      <div class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <Show
          when={!props.error}
          fallback={
            <div class="p-3">
              <LoadError error={props.error} />
            </div>
          }
        >
          <Show
            when={!props.loading}
            fallback={
              <div class="h-20 py-3">
                <Loading size="inline" ariaLabel={NEW_SONG_SSS_PLUS_COPY.loadingLabel} />
              </div>
            }
          >
            <Show
              when={prioritized()}
              fallback={
                <p class="px-3 py-4 text-center font-sans text-sm text-text-subtle">
                  {NEW_SONG_SSS_PLUS_COPY.noData}
                </p>
              }
            >
              {(current) => (
                <TheoreticalChartList
                  detailsLabel={props.detailsLabel}
                  entries={current().entries}
                  records={props.records}
                />
              )}
            </Show>
          </Show>
        </Show>
      </div>
      <Show when={boundaryEntries()?.length}>
        <BoundaryChartList
          entries={boundaryEntries() ?? []}
          rank={prioritized()?.entries.length ?? 0}
          records={props.records}
        />
      </Show>
    </div>
  )
}

/**
 * ログインユーザーのベスト枠・新曲枠理論値と現在スコア差を表示する。
 *
 * @returns ベスト枠・新曲枠理論値チェッカーのツールページ。
 */
const RatingTheoreticalCheckerPage: Component = () => {
  const username = (): string | undefined =>
    authSession.status === 'authenticated' ? authSession.user?.username : undefined
  const [rating] = createResource(username, fetchUserRatingWithCache)
  const [record] = createResource(username, fetchUserRecordWithCache)
  const theoreticalRatings = useRatingTheoretical()
  const [selectedFrame, setSelectedFrame] = useSelectedFrameState(
    () => RATING_THEORETICAL_CHECKER_PATH,
    () => 'best'
  )
  useAppMainScrollRestoration(
    () =>
      !rating.loading &&
      !record.loading &&
      (selectedFrame() === 'best'
        ? !theoreticalRatings.isBestLoading()
        : !theoreticalRatings.isNewLoading())
  )
  /** 未プレイ補完を除いた全通常譜面レコード */
  const playedRecords = createMemo(
    () => record()?.standard.filter((playerRecord) => playerRecord.score > 0) ?? []
  )

  const tool = getToolLink(RATING_THEORETICAL_CHECKER_PATH)
  useDocumentTitle(tool.title)

  return (
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <header class="flex items-start gap-3">
        <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <Gauge class="h-5 w-5 text-action-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-semibold">{tool.title}</h1>
          <p class="mt-1 font-sans text-sm text-text-muted">{tool.description}</p>
        </div>
      </header>

      <section
        class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
        aria-label={NEW_SONG_SSS_PLUS_COPY.summaryAriaLabel}
      >
        <div class="grid grid-cols-2 sm:grid-rows-2">
          <RatingTheoreticalFigure
            class="col-span-2 border-b border-border sm:col-span-1 sm:row-span-2 sm:border-r sm:border-b-0"
            label={NEW_SONG_SSS_PLUS_COPY.targetRating}
            icon={<Gauge class="h-4 w-4" aria-hidden="true" />}
            primary
            currentRating={rating()?.rating ?? null}
            error={rating.error ?? theoreticalRatings.bestError()}
            loading={rating.loading || theoreticalRatings.isBestLoading()}
            theoreticalRating={theoreticalRatings.overallTheoreticalRating()}
          />
          <RatingTheoreticalFigure
            class="border-r border-border sm:border-r-0 sm:border-b"
            label={NEW_SONG_SSS_PLUS_COPY.bestLabel}
            currentRating={rating()?.best_average ?? null}
            error={rating.error ?? theoreticalRatings.bestError()}
            loading={rating.loading || theoreticalRatings.isBestLoading()}
            theoreticalRating={theoreticalRatings.bestTheoreticalRating()}
          />
          <RatingTheoreticalFigure
            label={NEW_SONG_SSS_PLUS_COPY.newLabel}
            currentRating={rating()?.new_average ?? null}
            error={rating.error ?? theoreticalRatings.newError()}
            loading={rating.loading || theoreticalRatings.isNewLoading()}
            theoreticalRating={theoreticalRatings.newTheoreticalRating()}
          />
        </div>
        <Show
          when={
            !rating.error &&
            !rating.loading &&
            theoreticalRatings.overallTheoreticalRating()?.hasUnknownChartConstants
          }
        >
          <div class="flex items-center gap-2 border-t border-warning-border bg-warning-bg px-3 py-2 font-sans text-xs text-warning">
            <TriangleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{NEW_SONG_SSS_PLUS_COPY.unknownChartConstant}</span>
          </div>
        </Show>
      </section>

      <SegmentedTabs
        class="flex flex-col gap-3"
        value={selectedFrame()}
        onChange={setSelectedFrame}
        options={RATING_THEORETICAL_TAB_OPTIONS}
        listClass="w-full sm:w-fit"
        triggerClass="flex-1 sm:flex-none"
      >
        <AppTabContent value="best">
          <RatingTheoreticalCharts
            detailsLabel={NEW_SONG_SSS_PLUS_COPY.bestDetailsLabel}
            error={record.error ?? theoreticalRatings.bestError()}
            loading={record.loading || theoreticalRatings.isBestLoading()}
            records={playedRecords()}
            theoreticalRating={theoreticalRatings.bestTheoreticalRating()}
          />
        </AppTabContent>
        <AppTabContent value="new">
          <RatingTheoreticalCharts
            detailsLabel={NEW_SONG_SSS_PLUS_COPY.newDetailsLabel}
            error={record.error ?? theoreticalRatings.newError()}
            loading={record.loading || theoreticalRatings.isNewLoading()}
            records={playedRecords()}
            theoreticalRating={theoreticalRatings.newTheoreticalRating()}
          />
        </AppTabContent>
      </SegmentedTabs>
    </div>
  )
}

export default RatingTheoreticalCheckerPage

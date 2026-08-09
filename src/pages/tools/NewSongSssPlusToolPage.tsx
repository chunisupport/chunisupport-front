import { Collapsible } from '@kobalte/core/collapsible'
import { RadioGroup } from '@kobalte/core/radio-group'
import { A } from '@solidjs/router'
import { Gauge, TrendingUp, TriangleAlert } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createMemo, createResource, createSignal, For, Show } from 'solid-js'
import { LoadError, Loading } from '../../components'
import { AppDisclosureTrigger } from '../../components/common/AppDisclosureTrigger'
import { AppTabContent, SegmentedTabs } from '../../components/common/AppTabs'
import { RecordDifficultyBadge } from '../../components/common/record/RecordBadges'
import { SCORE_RANK_TEXT_CLASS } from '../../components/common/record/recordStyleClasses'
import { SelectableCardItem } from '../../components/common/SelectableCardButton'
import { buildSongDetailPath } from '../../constants/routes'
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
  resolveRatingTheoreticalProgress,
} from '../../utils/newSongTheoreticalRating'
import { formatInteger } from '../../utils/numberFormat'
import { formatPlayerRating, formatRatingFixed2 } from '../../utils/ratingFormat'
import { formatScoreDifference } from '../../utils/scoreDifference'
import { getScoreRank } from '../../utils/scoreRank'
import {
  NEW_SONG_SSS_PLUS_COPY,
  RATING_SCORE_SOURCE_OPTIONS,
  RATING_THEORETICAL_TAB_OPTIONS,
} from './newSongSssPlus.constants'

/** 理論値対象譜面へ反映するスコアの取得範囲。 */
type RatingScoreSource = (typeof RATING_SCORE_SOURCE_OPTIONS)[number]['value']

/** 枠理論値サマリーの計算結果、現在レコード、取得状態を受け取るプロパティ。 */
type RatingTheoreticalSummaryProps = {
  /** 理論値対象譜面との照合に使う現在の候補枠レコード。 */
  candidateRecords: readonly PlayerRecordDTO[]
  /** 現在の枠平均レーティング。未計算の場合はnull。 */
  currentRating: number | null
  /** 理論値対象譜面との照合に使う現在の採用枠レコード。 */
  currentRecords: readonly PlayerRecordDTO[]
  /** 理論値対象譜面一覧の開閉見出し。 */
  detailsLabel: string
  /** データ取得で発生したエラー。正常時は未定義。 */
  error: unknown
  /** 現在データを取得または理論値を計算しているか。 */
  loading: boolean
  /** 計算済みの枠理論値。対象譜面がない場合は未定義。 */
  theoreticalRating: RatingTheoretical | undefined
}

/** 理論値サマリー内の1指標に表示するアイコン、文言、値、推定状態。 */
type RatingMetricProps = {
  /** 指標名の前に表示する装飾アイコン。 */
  icon: JSX.Element
  /** 指標の表示名。 */
  label: string
  /** 未確定の譜面定数を含む推定値として強調するか。 */
  unknown: boolean
  /** 指標として表示する整形済みの値。 */
  value: string
}

/**
 * レーティング枠の指標をアイコン付きで表示する。
 *
 * @param props - 指標のアイコン、ラベル、表示値、推定値状態。
 * @returns 理論値サマリー内の1指標。
 */
const RatingMetric: Component<RatingMetricProps> = (props) => (
  <div class="flex min-w-0 flex-col items-center justify-center gap-1 px-3 py-3 text-center">
    <p class="flex items-center gap-1.5 whitespace-nowrap font-sans text-xs font-medium text-text-muted">
      {props.icon}
      {props.label}
    </p>
    <p
      class="font-jost text-xl font-bold tabular-nums text-text data-[unknown=true]:italic data-[unknown=true]:text-danger"
      data-unknown={props.unknown}
    >
      {props.value}
      <Show when={props.unknown}>
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
  </div>
)

/**
 * SSS+対象譜面の現在スコアとSSS+ボーダーとの差をランク色付きで表示する。
 *
 * @param props - 対象譜面と現在のレーティング枠・候補枠レコード。
 * @returns 現在スコアの所属、スコア、SSS+ボーダーとの差。
 */
const SssPlusChartProgress: Component<{
  candidateRecords: readonly PlayerRecordDTO[]
  currentRecords: readonly PlayerRecordDTO[]
  entry: RatingTheoreticalEntry
}> = (props) => {
  const progress = createMemo(() => {
    const resolved = resolveRatingTheoreticalProgress(
      props.entry,
      props.currentRecords,
      props.candidateRecords
    )
    if (resolved.slot === null || resolved.currentScore === null) {
      return undefined
    }
    return {
      slot: resolved.slot,
      currentScore: resolved.currentScore,
      scoreRank: getScoreRank(resolved.currentScore),
      scoreGap: resolved.scoreGap,
    }
  })

  return (
    <span class="col-span-2 col-start-3 flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-0.5 font-oswald text-xs tabular-nums text-text-muted">
      <Show
        when={progress()}
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
              <Show when={current.slot === 'candidate'}>
                <span class="mr-1 rounded bg-surface-hover px-1 py-0.5 font-sans text-[0.65rem] font-normal text-text-muted">
                  {NEW_SONG_SSS_PLUS_COPY.candidateSlotLabel}
                </span>
              </Show>
              <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.currentScoreLabel}</span>
              {formatInteger(current.currentScore)}
            </span>
            <Show when={current.scoreGap !== null}>
              <span
                class={`whitespace-nowrap font-semibold ${SCORE_RANK_TEXT_CLASS[current.scoreRank]}`}
              >
                <span class="mr-1 font-sans text-text-muted">
                  {NEW_SONG_SSS_PLUS_COPY.scoreGapLabel}
                </span>
                {formatScoreDifference(current.scoreGap ?? 0)}
              </span>
            </Show>
          </>
        )}
      </Show>
    </span>
  )
}

/**
 * 全譜面SSS+時にレーティング枠へ採用される譜面を単曲レーティング順に表示する。
 *
 * @param props - SSS+時に採用される譜面一覧と現在のレーティング枠・候補枠レコード。
 * @returns 楽曲詳細へ遷移できる折りたたみ一覧。
 */
const TheoreticalChartList: Component<{
  candidateRecords: readonly PlayerRecordDTO[]
  currentRecords: readonly PlayerRecordDTO[]
  detailsLabel: string
  entries: RatingTheoretical['entries']
}> = (props) => (
  <Collapsible class="border-t border-border" defaultOpen>
    <AppDisclosureTrigger
      label={props.detailsLabel}
      summary={`${props.entries.length}${NEW_SONG_SSS_PLUS_COPY.chartCountSuffix}`}
      class="py-1"
    />
    <Collapsible.Content>
      <ol class="divide-y divide-border border-t border-border">
        <For each={props.entries}>
          {(entry, index) => (
            <li>
              <A
                href={buildSongDetailPath(entry.songId, entry.difficulty)}
                class="grid grid-cols-[1.5rem_1.75rem_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-inherit hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset"
              >
                <span class="text-center font-oswald text-sm font-semibold text-text-muted">
                  {index() + 1}
                </span>
                <RecordDifficultyBadge difficulty={entry.difficulty} />
                <span class="min-w-0 font-sans">
                  <span class="block truncate text-sm font-semibold text-text">{entry.title}</span>
                  <span class="block truncate text-xs text-text-muted">{entry.artist}</span>
                </span>
                <span class="text-right font-oswald tabular-nums">
                  <span class="block text-base font-bold text-text">
                    <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.singleRatingLabel}</span>
                    {formatRatingFixed2(entry.rating)}
                  </span>
                  <span
                    class="block text-xs text-text-muted data-[unknown=true]:italic data-[unknown=true]:text-danger"
                    data-unknown={entry.isChartConstantUnknown}
                  >
                    <span class="sr-only">{NEW_SONG_SSS_PLUS_COPY.chartConstantLabel}</span>
                    {formatChartConst(entry.chartConstant)}
                    <Show when={entry.isChartConstantUnknown}>
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
                <SssPlusChartProgress
                  candidateRecords={props.candidateRecords}
                  currentRecords={props.currentRecords}
                  entry={entry}
                />
              </A>
            </li>
          )}
        </For>
      </ol>
    </Collapsible.Content>
  </Collapsible>
)

/**
 * レーティング枠の全譜面SSS+時レーティングと現在値からの差を表示する。
 *
 * @param props - 現在値、SSS+時レーティング、現在レコード、楽曲データの取得状態。
 * @returns レーティング枠の理論値サマリー。
 */
const RatingTheoreticalSummary: Component<RatingTheoreticalSummaryProps> = (props) => {
  const ratingGap = () =>
    props.theoreticalRating
      ? calculateRatingTheoreticalGap(props.theoreticalRating.rating, props.currentRating)
      : undefined
  const formattedRatingGap = () => {
    const gap = ratingGap()
    return gap === undefined ? NEW_SONG_SSS_PLUS_COPY.emptyValue : formatPlayerRating(gap)
  }

  return (
    <section
      class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
      aria-label={NEW_SONG_SSS_PLUS_COPY.ariaLabel}
    >
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
            when={props.theoreticalRating}
            fallback={
              <p class="px-3 py-4 text-center font-sans text-sm text-text-subtle">
                {NEW_SONG_SSS_PLUS_COPY.noData}
              </p>
            }
          >
            {(theoreticalRating) => (
              <>
                <div class="grid grid-cols-2 divide-x divide-border">
                  <RatingMetric
                    icon={<Gauge class="h-4 w-4" aria-hidden="true" />}
                    label={NEW_SONG_SSS_PLUS_COPY.targetRating}
                    unknown={theoreticalRating().hasUnknownChartConstants}
                    value={formatPlayerRating(theoreticalRating().rating)}
                  />
                  <RatingMetric
                    icon={<TrendingUp class="h-4 w-4" aria-hidden="true" />}
                    label={NEW_SONG_SSS_PLUS_COPY.currentGap}
                    unknown={theoreticalRating().hasUnknownChartConstants}
                    value={formattedRatingGap()}
                  />
                </div>
                <Show when={theoreticalRating().hasUnknownChartConstants}>
                  <div class="flex items-center gap-2 border-t border-warning-border bg-warning-bg px-3 py-2 font-sans text-xs text-warning">
                    <TriangleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{NEW_SONG_SSS_PLUS_COPY.unknownChartConstant}</span>
                  </div>
                </Show>
                <TheoreticalChartList
                  candidateRecords={props.candidateRecords}
                  currentRecords={props.currentRecords}
                  detailsLabel={props.detailsLabel}
                  entries={theoreticalRating().entries}
                />
              </>
            )}
          </Show>
        </Show>
      </Show>
    </section>
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
  const theoreticalRatings = useRatingTheoretical()
  const [selectedFrame, setSelectedFrame] = createSignal<'best' | 'new'>('best')
  const [selectedScoreSource, setSelectedScoreSource] = createSignal<RatingScoreSource>('frame')
  const [record] = createResource(
    () => (selectedScoreSource() === 'records' ? username() : undefined),
    fetchUserRecordWithCache
  )
  /** 未プレイ補完を除いた全通常譜面レコード。 */
  const playedRecords = createMemo(
    () => record()?.standard.filter((playerRecord) => playerRecord.score > 0) ?? []
  )
  /** 全レコードのスコアを反映する選択状態か。 */
  const isRecordSource = (): boolean => selectedScoreSource() === 'records'
  /** 選択中のスコア取得範囲で発生したエラー。 */
  const scoreSourceError = (): unknown => (isRecordSource() ? record.error : undefined)
  /** 選択中のスコア取得範囲を読み込み中か。 */
  const isScoreSourceLoading = (): boolean => isRecordSource() && record.loading

  useDocumentTitle(NEW_SONG_SSS_PLUS_COPY.title)

  return (
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <header class="flex items-start gap-3">
        <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <Gauge class="h-5 w-5 text-action-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-semibold">{NEW_SONG_SSS_PLUS_COPY.title}</h1>
          <p class="mt-1 font-sans text-sm text-text-muted">{NEW_SONG_SSS_PLUS_COPY.description}</p>
        </div>
      </header>

      <RadioGroup
        value={selectedScoreSource()}
        onChange={(value) => setSelectedScoreSource(value as RatingScoreSource)}
        aria-label={NEW_SONG_SSS_PLUS_COPY.scoreSourceLabel}
      >
        <RadioGroup.Label class="mb-2 block font-sans text-sm font-medium text-text-muted">
          {NEW_SONG_SSS_PLUS_COPY.scoreSourceLabel}
        </RadioGroup.Label>
        <div class="grid grid-cols-2 gap-2">
          <For each={RATING_SCORE_SOURCE_OPTIONS}>
            {(option) => (
              <SelectableCardItem
                value={option.value}
                title={option.label}
                description={option.description}
                ariaLabel={option.label}
                density="compact"
                class="rounded-md"
              />
            )}
          </For>
        </div>
      </RadioGroup>

      <SegmentedTabs
        class="flex flex-col gap-3"
        value={selectedFrame()}
        onChange={setSelectedFrame}
        options={RATING_THEORETICAL_TAB_OPTIONS}
        listClass="w-full sm:w-fit"
        triggerClass="flex-1 sm:flex-none"
      >
        <AppTabContent value="best">
          <RatingTheoreticalSummary
            currentRating={rating()?.best_average ?? null}
            currentRecords={isRecordSource() ? playedRecords() : (rating()?.best ?? [])}
            candidateRecords={isRecordSource() ? [] : (rating()?.best_candidate ?? [])}
            detailsLabel={NEW_SONG_SSS_PLUS_COPY.bestDetailsLabel}
            error={rating.error ?? scoreSourceError() ?? theoreticalRatings.bestError()}
            loading={rating.loading || isScoreSourceLoading() || theoreticalRatings.isBestLoading()}
            theoreticalRating={theoreticalRatings.bestTheoreticalRating()}
          />
        </AppTabContent>
        <AppTabContent value="new">
          <RatingTheoreticalSummary
            currentRating={rating()?.new_average ?? null}
            currentRecords={isRecordSource() ? playedRecords() : (rating()?.new ?? [])}
            candidateRecords={isRecordSource() ? [] : (rating()?.new_candidate ?? [])}
            detailsLabel={NEW_SONG_SSS_PLUS_COPY.newDetailsLabel}
            error={rating.error ?? scoreSourceError() ?? theoreticalRatings.newError()}
            loading={rating.loading || isScoreSourceLoading() || theoreticalRatings.isNewLoading()}
            theoreticalRating={theoreticalRatings.newTheoreticalRating()}
          />
        </AppTabContent>
      </SegmentedTabs>
    </div>
  )
}

export default RatingTheoreticalCheckerPage

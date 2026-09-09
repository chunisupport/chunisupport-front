import { ListOrdered, TriangleAlert } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createMemo, createResource, For, Show } from 'solid-js'
import { LoadError, Loading, PlayerDataEmptyState } from '../../components'
import { UserRecordCard } from '../../components/common/record/UserRecordCard'
import { ALL_SONG_BEST_SLOT_COUNT } from '../../constants/rating'
import { useAppMainScrollRestoration } from '../../hooks/useAppMainScrollRestoration'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'
import { fetchUserRecordWithCache } from '../../usecases/cache/fetchUserRecordWithCache'
import { buildAllSongBestFrame } from '../../utils/allSongBestFrame'
import { isNotFoundApiError } from '../../utils/apiError'
import { formatNullablePlayerRating } from '../../utils/ratingFormat'
import { ALL_SONG_BEST_FRAME_COPY } from './allSongBestFrame.constants'

/** 全曲ベスト枠サマリーの1指標に表示する文言、値、推定状態 */
type AverageMetricProps = {
  /** 指標の表示名 */
  label: string
  /** 未確定の譜面定数を含む推定値として強調するか */
  unknown: boolean
  /** 指標として表示する整形済みの値 */
  value: string
}

/**
 * 全曲ベスト枠の平均レーティングを表示する。
 *
 * @param props - 指標のラベル、表示値、推定値状態。
 * @returns サマリー内の1指標。
 */
const AverageMetric: Component<AverageMetricProps> = (props) => (
  <div class="flex min-w-0 flex-col items-center justify-center gap-1 px-3 py-3 text-center">
    <p class="whitespace-nowrap font-sans text-xs font-medium text-text-muted">{props.label}</p>
    <p
      class="font-jost text-xl font-bold tabular-nums text-text data-[unknown=true]:italic data-[unknown=true]:text-danger"
      data-unknown={props.unknown}
    >
      {props.value}
      <Show when={props.unknown}>
        <sup
          class="ml-0.5 align-super font-sans text-[0.55em]"
          title={ALL_SONG_BEST_FRAME_COPY.unknownChartConstant}
          aria-hidden="true"
        >
          {ALL_SONG_BEST_FRAME_COPY.unknownMarker}
        </sup>
        <span class="sr-only">{ALL_SONG_BEST_FRAME_COPY.unknownChartConstant}</span>
      </Show>
    </p>
  </div>
)

/**
 * ログインユーザーの全曲ベスト枠と30曲・50曲平均レーティングを表示する。
 *
 * @returns 全曲ベスト枠のツールページ。
 */
const AllSongBestFramePage: Component = () => {
  const username = (): string | undefined =>
    authSession.status === 'authenticated' ? authSession.user?.username : undefined
  const [record] = createResource(username, fetchUserRecordWithCache)
  const frame = createMemo(() => buildAllSongBestFrame(record()?.standard ?? []))
  const hasUnknownChartConstants = createMemo(
    () => frame().primaryHasUnknownChartConstants || frame().totalHasUnknownChartConstants
  )
  useAppMainScrollRestoration(() => !record.loading)
  useDocumentTitle(ALL_SONG_BEST_FRAME_COPY.title)

  return (
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <header class="flex items-start gap-3">
        <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <ListOrdered class="h-5 w-5 text-action-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-semibold">{ALL_SONG_BEST_FRAME_COPY.title}</h1>
          <p class="mt-1 font-sans text-sm text-text-muted">
            {ALL_SONG_BEST_FRAME_COPY.description}
          </p>
        </div>
      </header>

      <Show
        when={!record.error}
        fallback={
          <Show
            when={isNotFoundApiError(record.error)}
            fallback={<LoadError error={record.error} />}
          >
            <PlayerDataEmptyState />
          </Show>
        }
      >
        <Show
          when={!record.loading}
          fallback={
            <div class="h-40">
              <Loading ariaLabel={ALL_SONG_BEST_FRAME_COPY.loadingLabel} />
            </div>
          }
        >
          <Show
            when={frame().primaryRecords.length > 0}
            fallback={
              <p class="rounded-lg border border-border bg-surface p-6 text-center font-sans text-sm text-text-muted">
                {ALL_SONG_BEST_FRAME_COPY.empty}
              </p>
            }
          >
            <div class="flex flex-col gap-4">
              <section
                class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
                aria-label={ALL_SONG_BEST_FRAME_COPY.ariaLabel}
              >
                <div class="grid grid-cols-2 divide-x divide-border">
                  <AverageMetric
                    label={ALL_SONG_BEST_FRAME_COPY.primaryAverage}
                    unknown={frame().primaryHasUnknownChartConstants}
                    value={formatNullablePlayerRating(frame().primaryAverage)}
                  />
                  <AverageMetric
                    label={ALL_SONG_BEST_FRAME_COPY.totalAverage}
                    unknown={frame().totalHasUnknownChartConstants}
                    value={formatNullablePlayerRating(frame().totalAverage)}
                  />
                </div>
                <Show when={hasUnknownChartConstants()}>
                  <div class="flex items-center gap-2 border-t border-warning-border bg-warning-bg px-3 py-2 font-sans text-xs text-warning">
                    <TriangleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{ALL_SONG_BEST_FRAME_COPY.unknownChartConstant}</span>
                  </div>
                </Show>
              </section>

              <div class="flex flex-col gap-2">
                <For each={frame().primaryRecords}>
                  {(playerRecord, index) => (
                    <UserRecordCard record={playerRecord} index={index()} showJackets={true} />
                  )}
                </For>
                <Show when={frame().remainingRecords.length > 0}>
                  <hr
                    class="my-2 border-t-2 border-border-strong"
                    aria-label={ALL_SONG_BEST_FRAME_COPY.remainingSeparatorLabel}
                  />
                </Show>
                <For each={frame().remainingRecords}>
                  {(playerRecord, index) => (
                    <UserRecordCard
                      record={playerRecord}
                      index={index() + ALL_SONG_BEST_SLOT_COUNT.primary}
                      showJackets={true}
                    />
                  )}
                </For>
              </div>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  )
}

export default AllSongBestFramePage

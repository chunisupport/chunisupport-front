import { createQuery } from '@tanstack/solid-query'
import { createMemo, createSignal, onMount } from 'solid-js'
import { courseMasterQueryOptions } from '../../queries/courses'
import { useSongsData } from '../../stores/songsData'
import type { NormalizedPlayerDataUpdateResult } from '../../usecases/registerScoreCommit'
import { requestChangedSongMasters } from '../../usecases/registerScoreCommit'
import {
  REGISTER_SCORE_COPY,
  REGISTER_SCORE_RESULT_LAYOUT_CLASS,
  REGISTER_SCORE_STACK_MAX_WIDTH_CLASS,
} from './constants'
import { createRegisterScoreAggregateSectionState } from './createRegisterScoreAggregateSectionState'
import { createRegisterScoreChangeListState } from './createRegisterScoreChangeListState'
import { RegisterScoreAggregateSummary } from './RegisterScoreAggregateSummary'
import {
  RegisterScoreCourseChangesSection,
  RegisterScoreSongChangesSection,
} from './RegisterScoreChangeSections'
import { RegisterScoreDisplaySettings } from './RegisterScoreDisplaySettings'
import { RegisterScoreImagePreviewDialog } from './RegisterScoreImagePreviewDialog'
import { RegisterScoreProfileSummary } from './RegisterScoreProfileSummary'
import { RegisterScoreReport } from './RegisterScoreReport'
import { RegisterScoreReportScaleFrame } from './RegisterScoreReportScaleFrame'
import {
  captureRegisterScoreReportImages,
  type RegisterScoreImageCaptureResult,
  type RegisterScoreImageLayout,
} from './registerScoreImageCapture'
import { formatRegisterScoreImageFilename } from './registerScoreImageFiles'
import {
  resolveRegisterScoreChartLevel,
  resolveRegisterScoreCourseTitle,
  resolveRegisterScoreSongMetrics,
  resolveRegisterScoreSongSortValues,
  resolveRegisterScoreSongTitle,
} from './registerScoreResolvers'
import {
  createDefaultRegisterScoreStatisticRowVisibility,
  createDefaultRegisterScoreTotalHighScoreRowVisibility,
  toRegisterScoreStatisticRows,
  toRegisterScoreTotalHighScoreRows,
} from './registerScoreStatistics'
import { resolveReportMasterState } from './reportMasterState'

/** スコア登録結果画面へ渡す登録結果と表示値の解決関数 */
type RegisterScoreResultViewProps = {
  /** ページ見出し */
  pageTitle: string
  /** 表示用に正規化した登録結果 */
  result: NormalizedPlayerDataUpdateResult
  /** 更新された楽曲がない場合の文言 */
  changedSongsEmptyMessage?: string
}

/**
 * スコア登録完了後の結果と差分一覧を表示する。
 *
 * 表示設定の状態を生成し、表示設定・縮小表示枠・画像化する原寸レポートを組み立てる。
 *
 * @param props - ページ見出し、登録結果、空状態文言。
 * @returns 登録結果パネル。
 */
export const RegisterScoreResultView = (props: RegisterScoreResultViewProps) => {
  const songs = useSongsData()
  onMount(() => requestChangedSongMasters(props.result, songs))
  const hasCourses = () => props.result.changes.some((change) => change.record_type === 'course')
  const courses = createQuery(() => ({
    ...courseMasterQueryOptions(),
    enabled: hasCourses(),
  }))
  const masterState = () =>
    resolveReportMasterState(
      imageTypes(),
      songs.songsRevalidationFailed() && !songs.songsResponse.loading
        ? 'errored'
        : songs.songsResponse.state,
      songs.worldsendSongsResponse.state,
      courses.isFetching ? 'pending' : courses.status
    )
  // errored の Resource.latest は例外を投げるため、結果表示と再試行導線を残す。
  const standard = () =>
    songs.songsResponse.error ? [] : (songs.songsResponse.latest?.songs ?? [])
  const worldsend = () =>
    songs.worldsendSongsResponse.error ? [] : (songs.worldsendSongsResponse.latest?.songs ?? [])
  /** 失敗した補助データだけを再取得し、登録の確定処理は再実行しない。 */
  const retryMasters = () => {
    requestChangedSongMasters(props.result, songs)
    if (imageTypes().has('course') && courses.isError) void courses.refetch()
  }
  const changeList = createRegisterScoreChangeListState({
    changes: () => props.result.changes,
    resolveSongSortValues: (change) => resolveRegisterScoreSongSortValues(change, standard()),
  })
  const imageTypes = createMemo(
    () =>
      new Set(
        [...changeList.songChanges(), ...changeList.courseChanges()]
          .filter((change) => !changeList.isExcludedFromImage(change))
          .map((change) => change.record_type)
      )
  )
  const totalHighScore = createRegisterScoreAggregateSectionState({
    rows: () => toRegisterScoreTotalHighScoreRows(props.result.statistics),
    initialRowVisibility: createDefaultRegisterScoreTotalHighScoreRowVisibility(
      props.result.statistics
    ),
  })
  const recordStatistics = createRegisterScoreAggregateSectionState({
    rows: () => toRegisterScoreStatisticRows(props.result.statistics),
    initialRowVisibility: createDefaultRegisterScoreStatisticRowVisibility(props.result.statistics),
  })
  const [showClassEmblem, setShowClassEmblem] = createSignal(true)
  let reportRef!: HTMLElement

  /**
   * 現在表示中の更新差分レポートを選択した形式のJPEGへ変換する。
   *
   * @param layout - 自動分割または1枚出力。
   * @returns ページ順に並ぶJPEG画像と自動分割時の枚数。
   */
  const captureReportImages = (
    layout: RegisterScoreImageLayout
  ): Promise<RegisterScoreImageCaptureResult> => captureRegisterScoreReportImages(reportRef, layout)

  return (
    <div class="@container mx-auto flex w-full max-w-5xl flex-col gap-4">
      <header
        class={`mx-auto flex w-full ${REGISTER_SCORE_STACK_MAX_WIDTH_CLASS} flex-col gap-4 @min-[59rem]:max-w-none @min-[59rem]:flex-row @min-[59rem]:items-center @min-[59rem]:justify-between`}
      >
        <h1 class="text-2xl font-semibold">{props.pageTitle}</h1>
        <RegisterScoreImagePreviewDialog
          captureImages={captureReportImages}
          masterState={masterState()}
          retryMasters={retryMasters}
          imageFilename={formatRegisterScoreImageFilename(props.result.imported_at)}
        />
      </header>
      <div class={REGISTER_SCORE_RESULT_LAYOUT_CLASS}>
        <RegisterScoreDisplaySettings
          primarySortKey={changeList.sortSettings().primaryKey}
          primarySortDirection={changeList.sortSettings().primaryDirection}
          hideLampOnlyChanges={changeList.hideLampOnlyChanges()}
          showClassEmblem={showClassEmblem()}
          showTotalHighScore={totalHighScore.enabled()}
          showRecordStatistics={recordStatistics.enabled()}
          totalHighScoreRowVisibility={totalHighScore.rowVisibility()}
          statisticRowVisibility={recordStatistics.rowVisibility()}
          onPrimarySortKeyChange={changeList.setPrimarySortKey}
          onPrimarySortDirectionChange={changeList.setPrimarySortDirection}
          onHideLampOnlyChangesChange={changeList.setHideLampOnlyChanges}
          onShowClassEmblemChange={setShowClassEmblem}
          onShowTotalHighScoreChange={totalHighScore.setEnabled}
          onShowRecordStatisticsChange={recordStatistics.setEnabled}
          onTotalHighScoreRowVisibilityChange={totalHighScore.setRowVisible}
          onStatisticRowVisibilityChange={recordStatistics.setRowVisible}
        />
        <RegisterScoreReportScaleFrame>
          <RegisterScoreReport ref={reportRef} result={props.result}>
            <RegisterScoreProfileSummary
              result={props.result}
              showClassEmblem={showClassEmblem()}
            />
            <RegisterScoreAggregateSummary
              totalHighScoreRows={totalHighScore.visibleRows()}
              statisticRows={recordStatistics.visibleRows()}
              totalHighScoreDisplayed={totalHighScore.displayed()}
              recordStatisticsDisplayed={recordStatistics.displayed()}
            />
            <RegisterScoreSongChangesSection
              changes={changeList.songChanges()}
              resolveSongTitle={(change) =>
                resolveRegisterScoreSongTitle(change, standard(), worldsend())
              }
              resolveChartLevel={(change) =>
                resolveRegisterScoreChartLevel(change, standard(), worldsend())
              }
              resolveSongMetrics={(change) => resolveRegisterScoreSongMetrics(change, standard())}
              emptyMessage={
                changeList.hideLampOnlyChanges()
                  ? REGISTER_SCORE_COPY.filteredChangedSongsEmpty
                  : props.changedSongsEmptyMessage
              }
              excludedFromImage={changeList.songSectionExcludedFromImage()}
              isChangeExcludedFromImage={changeList.isExcludedFromImage}
              onChangeExcludedFromImage={changeList.setExcludedFromImage}
            />
            <RegisterScoreCourseChangesSection
              changes={changeList.courseChanges()}
              resolveCourseTitle={(change) =>
                resolveRegisterScoreCourseTitle(change, courses.data?.courses ?? [])
              }
              excludedFromImage={changeList.courseSectionExcludedFromImage()}
              isChangeExcludedFromImage={changeList.isExcludedFromImage}
              onChangeExcludedFromImage={changeList.setExcludedFromImage}
            />
          </RegisterScoreReport>
        </RegisterScoreReportScaleFrame>
      </div>
    </div>
  )
}

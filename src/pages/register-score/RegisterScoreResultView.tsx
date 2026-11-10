import { createSignal } from 'solid-js'
import type { NormalizedPlayerDataUpdateResult } from '../../usecases/registerScoreCommit'
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
import type {
  RegisterScoreChartLevelResolver,
  RegisterScoreCourseTitleResolver,
  RegisterScoreSongMetricsResolver,
  RegisterScoreSongSortValuesResolver,
  RegisterScoreSongTitleResolver,
} from './registerScoreResolvers'
import {
  createDefaultRegisterScoreStatisticRowVisibility,
  createDefaultRegisterScoreTotalHighScoreRowVisibility,
  toRegisterScoreStatisticRows,
  toRegisterScoreTotalHighScoreRows,
} from './registerScoreStatistics'

/** スコア登録結果画面へ渡す登録結果と表示値の解決関数 */
type RegisterScoreResultViewProps = {
  /** ページ見出し */
  pageTitle: string
  /** 表示用に正規化した登録結果 */
  result: NormalizedPlayerDataUpdateResult
  /** 楽曲タイトルの解決関数 */
  resolveSongTitle: RegisterScoreSongTitleResolver
  /** 譜面レベル表記の解決関数 */
  resolveChartLevel?: RegisterScoreChartLevelResolver
  /** 単曲メトリクスの解決関数 */
  resolveSongMetrics: RegisterScoreSongMetricsResolver
  /** 楽曲カードのソート値の解決関数 */
  resolveSongSortValues: RegisterScoreSongSortValuesResolver
  /** コースタイトルの解決関数 */
  resolveCourseTitle: RegisterScoreCourseTitleResolver
  /** 更新された楽曲がない場合の文言 */
  changedSongsEmptyMessage?: string
}

/**
 * スコア登録完了後の結果と差分一覧を表示する。
 *
 * 表示設定の状態を生成し、表示設定・縮小表示枠・画像化する原寸レポートを組み立てる。
 *
 * @param props - ページ見出し、登録結果、各表示値の解決関数、空状態文言。
 * @returns 登録結果パネル。
 */
export const RegisterScoreResultView = (props: RegisterScoreResultViewProps) => {
  const changeList = createRegisterScoreChangeListState({
    changes: () => props.result.changes,
    resolveSongSortValues: (change) => props.resolveSongSortValues(change),
  })
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
              resolveSongTitle={props.resolveSongTitle}
              resolveChartLevel={props.resolveChartLevel}
              resolveSongMetrics={props.resolveSongMetrics}
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
              resolveCourseTitle={props.resolveCourseTitle}
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

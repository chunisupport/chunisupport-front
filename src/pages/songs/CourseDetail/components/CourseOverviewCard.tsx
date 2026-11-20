import { Show } from 'solid-js'
import type { CourseStatsBandDTO } from '../../../../types/api'
import { calculateChartStatsPercent } from '../../../../utils/chartStats'
import { formatCourseStatsRate } from '../../../../utils/courseStats'
import { truncateDecimal } from '../../../../utils/numberFormat'
import { COURSE_PAGE_COPY } from '../../constants'

type Props = {
  /** 全プレイヤー集計（ALL）の統計行。未取得または未集計時は undefined */
  allStats: CourseStatsBandDTO | undefined
}

/** サマリーカード1枚分の共通クラス */
const SUMMARY_CARD_CLASS =
  'flex flex-col justify-between gap-2 rounded-md border border-border bg-surface p-3 sm:p-4'
/** サマリーカード見出しの共通クラス */
const SUMMARY_LABEL_CLASS = 'text-xs font-medium text-text-subtle'
/** サマリーカード主要数値の共通クラス */
const SUMMARY_VALUE_CLASS = 'font-jost text-xl font-semibold leading-tight tabular-nums sm:text-2xl'
/** サマリーカード補足テキストの共通クラス */
const SUMMARY_SUB_CLASS = 'font-jost text-xs text-text-muted tabular-nums'
/** 達成率バーの外枠クラス */
const RATE_BAR_TRACK_CLASS = 'h-1.5 w-full overflow-hidden rounded-full bg-surface-muted'

/**
 * スコアを切り捨て整数で桁区切り表示へ整形する。
 *
 * @param score - 平均または中央値スコア。
 * @returns 整形済みスコア。null の場合はハイフン。
 */
const formatSummaryScore = (score: number | null | undefined): string =>
  score === null || score === undefined ? '-' : truncateDecimal(score, 0).toLocaleString('ja-JP')

/**
 * コース全体の統計サマリー（プレイ人数・クリア率・FC/AJ率・CLEAR平均）をカード群で表示する。
 *
 * @param props - ALL帯のコース統計。
 * @returns コース概要サマリーカード群。
 */
const CourseOverviewCard = (props: Props) => {
  const clearPercent = () => {
    const band = props.allStats
    if (!band) return null
    return calculateChartStatsPercent(band.clear.clear, band.player_count)
  }
  const fcOrAjCount = () => {
    const band = props.allStats
    return band ? band.combo.fc + band.combo.aj : 0
  }
  const fcOnlyPercent = () => {
    const band = props.allStats
    if (!band) return null
    return calculateChartStatsPercent(band.combo.fc, band.player_count)
  }
  const ajPercent = () => {
    const band = props.allStats
    if (!band) return null
    return calculateChartStatsPercent(band.combo.aj, band.player_count)
  }

  return (
    <section
      aria-label={COURSE_PAGE_COPY.overview.sectionAriaLabel}
      class="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      <div class={SUMMARY_CARD_CLASS}>
        <p class={SUMMARY_LABEL_CLASS}>{COURSE_PAGE_COPY.overview.players}</p>
        <div class="space-y-1">
          <p class={SUMMARY_VALUE_CLASS}>
            <Show when={props.allStats} fallback="-">
              {(band) => (
                <>
                  {band().player_count.toLocaleString('ja-JP')}
                  <span class="ml-1 font-sans text-sm font-normal text-text-muted">
                    {COURSE_PAGE_COPY.overview.playersUnit}
                  </span>
                </>
              )}
            </Show>
          </p>
        </div>
      </div>

      <div class={SUMMARY_CARD_CLASS}>
        <p class={SUMMARY_LABEL_CLASS}>{COURSE_PAGE_COPY.overview.clearRate}</p>
        <div class="space-y-1.5">
          <p class={SUMMARY_VALUE_CLASS}>
            {props.allStats
              ? formatCourseStatsRate(props.allStats.clear.clear, props.allStats.player_count)
              : '-'}
          </p>
          <div class={RATE_BAR_TRACK_CLASS} aria-hidden="true">
            <div
              class="h-full rounded-full transition-all"
              style={{
                width: `${clearPercent() ?? 0}%`,
                background: 'var(--cs-color-lamp-clear-bg)',
              }}
            />
          </div>
          <p class={SUMMARY_SUB_CLASS}>
            <Show when={props.allStats} fallback="-">
              {(band) =>
                `${band().clear.clear.toLocaleString('ja-JP')} / ${band().player_count.toLocaleString('ja-JP')}`
              }
            </Show>
          </p>
        </div>
      </div>

      <div class={SUMMARY_CARD_CLASS}>
        <p class={SUMMARY_LABEL_CLASS}>{COURSE_PAGE_COPY.overview.comboRate}</p>
        <div class="space-y-1.5">
          <p class={SUMMARY_VALUE_CLASS}>
            {props.allStats
              ? formatCourseStatsRate(fcOrAjCount(), props.allStats.player_count)
              : '-'}
          </p>
          <div class={`${RATE_BAR_TRACK_CLASS} flex`} aria-hidden="true">
            <div
              class="h-full transition-all"
              style={{
                width: `${ajPercent() ?? 0}%`,
                background: 'var(--cs-color-lamp-all-justice-bg)',
              }}
            />
            <div
              class="h-full transition-all"
              style={{
                width: `${fcOnlyPercent() ?? 0}%`,
                background: 'var(--cs-color-lamp-full-combo-bg)',
              }}
            />
          </div>
          <p class={SUMMARY_SUB_CLASS}>
            <Show when={props.allStats} fallback="-">
              {(band) =>
                `${COURSE_PAGE_COPY.overview.ajPrefix} ${formatCourseStatsRate(band().combo.aj, band().player_count)}`
              }
            </Show>
          </p>
        </div>
      </div>

      <div class={SUMMARY_CARD_CLASS}>
        <p class={SUMMARY_LABEL_CLASS}>{COURSE_PAGE_COPY.overview.averageScore}</p>
        <div class="space-y-1">
          <p class={SUMMARY_VALUE_CLASS}>{formatSummaryScore(props.allStats?.average_score)}</p>
          <p class={SUMMARY_SUB_CLASS}>
            {COURSE_PAGE_COPY.overview.medianPrefix}{' '}
            {formatSummaryScore(props.allStats?.median_score)}
          </p>
        </div>
      </div>
    </section>
  )
}

export default CourseOverviewCard

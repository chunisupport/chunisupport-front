import { Info } from 'lucide-solid'
import type { Accessor, Component } from 'solid-js'
import { Show } from 'solid-js'
import {
  formatLockedSongsOverPowerDelta,
  formatLockedSongsOverPowerPercentDelta,
  formatOfficialOverPowerDisplay,
  getLockedSongsOpComparisonDeltaDirection,
  type LockedSongsOpComparisonResult,
} from '../../../../usecases/overpower/lockedSongsOpComparison'
import { formatOverPowerPercent, formatOverPowerValue } from '../../../../utils/overPowerFormat'
import {
  LOCKED_SONGS_OP_COMPARISON_COPY,
  OVER_POWER_SUMMARY_PERCENT_DECIMAL_PLACES,
} from '../constants'

type Props = {
  /** 未解禁設定の下書きに対する公式値と計算値の照合結果 */
  comparison: Accessor<LockedSongsOpComparisonResult>
}

/**
 * 数値セルの文字色を一致状態から決める。
 *
 * @param matched - 公式値と計算値が一致するか。比較対象が無い場合はnull。
 * @returns 一致・不一致・未比較に応じた文字色クラス。
 */
const valueToneClass = (matched: boolean | null): string => {
  if (matched === true) return 'text-success'
  if (matched === false) return 'text-warning'
  return 'text-text'
}

/**
 * 未解禁楽曲設定ダイアログで公式OP/OP%と計算値を並べて表示する。
 *
 * @param props - 公式値と計算値の照合結果。
 * @returns 公式値と計算値の比較表。
 */
export const LockedSongsOpComparison: Component<Props> = (props) => {
  const officialPercentText = (): string => {
    const officialPercent = props.comparison().officialOverPowerPercent
    return officialPercent === null
      ? LOCKED_SONGS_OP_COMPARISON_COPY.missingValue
      : `${formatOfficialOverPowerDisplay(officialPercent)}%`
  }
  const overPowerDeltaText = (): string =>
    formatLockedSongsOverPowerDelta(
      props.comparison().calculatedOverPower,
      props.comparison().officialOverPower
    )
  const percentDeltaText = (): string | null => {
    const officialPercent = props.comparison().officialOverPowerPercent
    if (officialPercent === null) return null
    return formatLockedSongsOverPowerPercentDelta(
      props.comparison().calculatedOverPowerPercent,
      officialPercent
    )
  }
  const overPowerGuidanceText = (): string | null => {
    const direction = getLockedSongsOpComparisonDeltaDirection(
      props.comparison().calculatedOverPower,
      props.comparison().officialOverPower
    )
    if (direction === 'higher') {
      return LOCKED_SONGS_OP_COMPARISON_COPY.guidance.overPowerHigher
    }
    if (direction === 'lower') {
      return LOCKED_SONGS_OP_COMPARISON_COPY.guidance.overPowerLower
    }
    return null
  }
  const percentGuidanceText = (): string | null => {
    const officialPercent = props.comparison().officialOverPowerPercent
    if (officialPercent === null) return null
    const direction = getLockedSongsOpComparisonDeltaDirection(
      props.comparison().calculatedOverPowerPercent,
      officialPercent
    )
    if (direction === 'higher') {
      return LOCKED_SONGS_OP_COMPARISON_COPY.guidance.overPowerPercentHigher
    }
    if (direction === 'lower') {
      return LOCKED_SONGS_OP_COMPARISON_COPY.guidance.overPowerPercentLower
    }
    return null
  }
  const statusLabel = (): string =>
    props.comparison().matched
      ? LOCKED_SONGS_OP_COMPARISON_COPY.matched
      : LOCKED_SONGS_OP_COMPARISON_COPY.mismatched

  return (
    <div class="mt-3 flex min-w-0 flex-col items-center gap-2" aria-live="polite">
      <div class="w-fit max-w-full rounded-md border border-border bg-surface-muted px-3 py-2">
        <table class="w-auto max-w-full border-collapse text-sm">
          <caption class="sr-only">
            {`${LOCKED_SONGS_OP_COMPARISON_COPY.official} ${formatOfficialOverPowerDisplay(
              props.comparison().officialOverPower
            )} ${officialPercentText()} ${LOCKED_SONGS_OP_COMPARISON_COPY.calculated} ${formatOverPowerValue(
              props.comparison().calculatedOverPower
            )} ${formatOverPowerPercent(
              props.comparison().calculatedOverPowerPercent,
              OVER_POWER_SUMMARY_PERCENT_DECIMAL_PLACES
            )}% ${statusLabel()} ${overPowerDeltaText()} ${percentDeltaText() ?? ''}`}
          </caption>
          <thead>
            <tr class="font-sans text-xs text-text-muted">
              <th class="py-0.5 pr-3 text-left font-medium" scope="col">
                <span class="sr-only">{LOCKED_SONGS_OP_COMPARISON_COPY.kind}</span>
              </th>
              <th class="py-0.5 px-3 text-center font-medium" scope="col">
                {LOCKED_SONGS_OP_COMPARISON_COPY.overPower}
              </th>
              <th class="py-0.5 px-3 text-center font-medium" scope="col">
                {LOCKED_SONGS_OP_COMPARISON_COPY.overPowerPercent}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th
                class="py-0.5 pr-3 text-left font-sans text-xs font-medium text-text-muted"
                scope="row"
              >
                {LOCKED_SONGS_OP_COMPARISON_COPY.official}
              </th>
              <td class="py-0.5 px-3 text-left font-jost tabular-nums text-text">
                {formatOfficialOverPowerDisplay(props.comparison().officialOverPower)}
              </td>
              <td class="py-0.5 px-3 text-left font-jost tabular-nums text-text">
                {officialPercentText()}
              </td>
            </tr>
            <tr>
              <th
                class="py-0.5 pr-3 text-left font-sans text-xs font-medium text-text-muted"
                scope="row"
              >
                {LOCKED_SONGS_OP_COMPARISON_COPY.calculated}
              </th>
              <td
                class={`py-0.5 px-3 text-left font-jost tabular-nums ${valueToneClass(
                  props.comparison().overPowerMatched
                )}`}
              >
                {formatOverPowerValue(props.comparison().calculatedOverPower)}
              </td>
              <td
                class={`py-0.5 px-3 text-left font-jost tabular-nums ${valueToneClass(
                  props.comparison().percentMatched
                )}`}
              >
                {formatOverPowerPercent(
                  props.comparison().calculatedOverPowerPercent,
                  OVER_POWER_SUMMARY_PERCENT_DECIMAL_PLACES
                )}
                %
              </td>
            </tr>
          </tbody>
          <Show when={!props.comparison().matched}>
            <tfoot>
              <tr class="text-warning">
                <th class="border-t border-border-strong py-0.5 pr-3" scope="row">
                  <span class="sr-only">{LOCKED_SONGS_OP_COMPARISON_COPY.mismatched}</span>
                </th>
                <td class="border-t border-border-strong py-0.5 px-3 text-left font-jost tabular-nums">
                  <Show when={!props.comparison().overPowerMatched}>{overPowerDeltaText()}</Show>
                </td>
                <td class="border-t border-border-strong py-0.5 px-3 text-left font-jost tabular-nums">
                  <Show when={props.comparison().percentMatched === false}>
                    {percentDeltaText()}
                  </Show>
                </td>
              </tr>
            </tfoot>
          </Show>
        </table>
      </div>
      <Show when={overPowerGuidanceText()}>
        {(message) => (
          <div class="flex w-full min-w-0 items-start gap-2 rounded-md border border-info-border bg-info-bg px-3 py-2 font-sans text-sm text-info">
            <Info class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p class="min-w-0 flex-1 break-words">
              <span class="font-medium">{LOCKED_SONGS_OP_COMPARISON_COPY.overPower}:</span>{' '}
              {message()}
            </p>
          </div>
        )}
      </Show>
      <Show when={percentGuidanceText()}>
        {(message) => (
          <div class="flex w-full min-w-0 items-start gap-2 rounded-md border border-info-border bg-info-bg px-3 py-2 font-sans text-sm text-info">
            <Info class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p class="min-w-0 flex-1 break-words">
              <span class="font-medium">{LOCKED_SONGS_OP_COMPARISON_COPY.overPowerPercent}:</span>{' '}
              {message()}
            </p>
          </div>
        )}
      </Show>
    </div>
  )
}

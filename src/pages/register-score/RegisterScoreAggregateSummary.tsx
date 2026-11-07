import { For, Show } from 'solid-js'
import { formatInteger } from '../../utils/numberFormat'
import { REGISTER_SCORE_COPY } from './constants'
import {
  formatRegisterScoreStatisticDelta,
  getRegisterScoreStatisticColumnDividerClass,
  getRegisterScoreStatisticDifficultyTextClass,
  getRegisterScoreTotalHighScoreDeltaClass,
} from './registerScoreDisplay'
import {
  REGISTER_SCORE_STAT_COLUMNS,
  type RegisterScoreStatisticRow,
  type RegisterScoreTotalHighScoreRow,
} from './registerScoreStatistics'

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
          <th class="w-12 border-r border-border px-1 py-1 text-center"></th>
          <For each={REGISTER_SCORE_STAT_COLUMNS}>
            {(column) => (
              <th class={`px-1 py-1 ${getRegisterScoreStatisticColumnDividerClass(column)}`}>
                {column}
              </th>
            )}
          </For>
        </tr>
      </thead>
      <tbody>
        <For each={props.rows}>
          {(row, index) => (
            <tr
              class={`${index() < props.rows.length - 1 ? 'border-b border-border ' : ''}align-top`}
            >
              <th
                class={`border-r border-border px-1 py-2 text-center text-sm font-extrabold ${getRegisterScoreStatisticDifficultyTextClass(row.difficulty)}`}
              >
                {row.label}
              </th>
              <For each={REGISTER_SCORE_STAT_COLUMNS}>
                {(column) => (
                  <td
                    class={`px-1 py-2 leading-4 ${getRegisterScoreStatisticColumnDividerClass(column)}`}
                  >
                    <div class="font-jost">{row.values[column].after}</div>
                    <Show when={row.values[column].delta !== 0}>
                      <div class="font-jost text-[0.65rem] font-bold text-blue-700">
                        {formatRegisterScoreStatisticDelta(row.values[column].delta)}
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
 * 登録後の通常譜面およびWORLD'S END集計を表示する。
 *
 * @param props - 表示設定を反映済みのTOTAL HIGH SCORE行・RECORD STATISTICS行と、各セクションをレポートへ表示するか。
 * @returns 集計値セクション。
 */
export const RegisterScoreAggregateSummary = (props: {
  totalHighScoreRows: RegisterScoreTotalHighScoreRow[]
  statisticRows: RegisterScoreStatisticRow[]
  totalHighScoreDisplayed: boolean
  recordStatisticsDisplayed: boolean
}) => (
  <>
    <Show when={props.totalHighScoreDisplayed}>
      <section class="py-4">
        <h2 class="mb-3 whitespace-nowrap text-xl font-extrabold leading-6">
          {REGISTER_SCORE_COPY.totalHighScoreTitle}
        </h2>
        <div class="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
          <For each={props.totalHighScoreRows}>
            {(row) => (
              <p class="grid grid-cols-[2.25rem_1fr] items-baseline gap-1">
                <span
                  class={`font-extrabold ${getRegisterScoreStatisticDifficultyTextClass(row.difficulty)}`}
                >
                  {row.label}
                </span>
                <span class="min-w-0">
                  <span class="block font-jost font-medium">{formatInteger(row.value.after)}</span>
                  <Show when={row.value.delta !== 0}>
                    <span
                      class={`block font-jost text-xs font-bold ${getRegisterScoreTotalHighScoreDeltaClass(row.value.delta)}`}
                    >
                      ({formatRegisterScoreStatisticDelta(row.value.delta)})
                    </span>
                  </Show>
                </span>
              </p>
            )}
          </For>
        </div>
      </section>
    </Show>

    <Show when={props.recordStatisticsDisplayed}>
      <section class="py-4">
        <h2 class="mb-3 whitespace-nowrap text-xl font-extrabold leading-6">
          {REGISTER_SCORE_COPY.recordStatsTitle}
        </h2>
        <RegisterScoreLampStatistics rows={props.statisticRows} />
      </section>
    </Show>
  </>
)

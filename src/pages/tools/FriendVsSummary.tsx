import type { JSX } from 'solid-js'
import { createMemo, For } from 'solid-js'
import { Swords } from 'lucide-solid'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import type { FriendScoreComparisonResponseDTO } from '../../types/api'
import { formatInteger } from '../../utils/numberFormat'
import { summarizeFriendVsMatches } from '../../utils/friendVs'
import { FRIEND_VS_COPY } from './friendVs.constants'

/**
 * 勝敗と譜面への挑戦状況を対戦結果として表示する。
 *
 * @param props - 比較APIの集計と対戦者。
 * @returns 勝ち数と挑戦状況の可視化。
 */
export const FriendVsSummary = (props: {
  comparison: FriendScoreComparisonResponseDTO
}): JSX.Element => {
  const segments = createMemo(() => [
    {
      label: FRIEND_VS_COPY.bothChallenged,
      value: props.comparison.summary.both_played,
      colorClass: 'bg-action-primary',
    },
    {
      label: FRIEND_VS_COPY.selfOnlyChallenged,
      value: props.comparison.summary.self_only_played,
      colorClass: 'bg-success',
    },
    {
      label: FRIEND_VS_COPY.friendOnlyChallenged,
      value: props.comparison.summary.friend_only_played,
      colorClass: 'bg-info',
    },
    {
      label: FRIEND_VS_COPY.neitherChallenged,
      value: props.comparison.summary.both_unplayed,
      colorClass: 'bg-border-strong',
    },
  ])
  const matches = createMemo(() => summarizeFriendVsMatches(props.comparison.items))

  return (
    <section
      aria-labelledby="friend-vs-result-title"
      class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
    >
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
        <div class="flex items-center gap-2">
          <h2 id="friend-vs-result-title" class="text-lg font-semibold">
            {FRIEND_VS_COPY.resultTitle}
          </h2>
          <DifficultyBadge difficulty={props.comparison.difficulty} />
        </div>
        <span class="rounded-full bg-surface-muted px-3 py-1 font-sans text-xs text-text-muted">
          {FRIEND_VS_COPY.totalCharts} {formatInteger(props.comparison.summary.total_charts)}
        </span>
      </div>

      <div class="px-4 pt-4 text-center font-sans text-xs text-text-muted sm:px-6">
        {FRIEND_VS_COPY.matchedCharts} {formatInteger(matches().total)}
      </div>
      <dl class="grid grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] items-center gap-2 px-3 py-5 text-center sm:gap-4 sm:px-6">
        <div class="min-w-0">
          <dt class="flex min-w-0 flex-col gap-0.5 font-sans text-sm">
            <span class="break-words font-semibold" title={props.comparison.self.player_name}>
              {props.comparison.self.player_name || `@${props.comparison.self.username}`}
            </span>
            <span class="text-xs text-text-muted">あなたの{FRIEND_VS_COPY.wins}</span>
          </dt>
          <dd class="mt-1 font-jost text-3xl font-bold tabular-nums text-action-primary sm:text-4xl">
            {formatInteger(matches().selfWins)}
          </dd>
        </div>
        <div class="px-1">
          <dt class="flex justify-center"><Swords class="h-5 w-5 text-text-muted" aria-hidden="true" /></dt>
          <dd class="mt-1 font-sans text-xs text-text-muted">
            {FRIEND_VS_COPY.draws} <span class="font-jost font-semibold tabular-nums">{formatInteger(matches().draws)}</span>
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="flex min-w-0 flex-col gap-0.5 font-sans text-sm">
            <span class="break-words font-semibold" title={props.comparison.friend.player_name}>
              {props.comparison.friend.player_name || `@${props.comparison.friend.username}`}
            </span>
            <span class="text-xs text-text-muted">相手の{FRIEND_VS_COPY.wins}</span>
          </dt>
          <dd class="mt-1 font-jost text-3xl font-bold tabular-nums text-info sm:text-4xl">
            {formatInteger(matches().friendWins)}
          </dd>
        </div>
      </dl>

      <div class="border-t border-border bg-surface-muted px-4 py-4 sm:px-6">
        <h3 class="font-sans text-sm font-semibold">{FRIEND_VS_COPY.challengeTitle}</h3>
        <div
          class="mt-3 flex h-2.5 overflow-hidden rounded-full bg-border-strong"
          aria-hidden="true"
        >
          <For each={segments()}>
            {(segment) => (
              <span class={segment.colorClass} style={{ flex: `${segment.value} 0 0%` }} />
            )}
          </For>
        </div>
        <ul class="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 font-sans text-xs sm:grid-cols-4">
          <For each={segments()}>
            {(segment) => (
              <li class="flex min-w-0 items-center gap-2">
                <span
                  class={`h-2.5 w-2.5 shrink-0 rounded-full ${segment.colorClass}`}
                  aria-hidden="true"
                />
                <span class="min-w-0">{segment.label}</span>
                <span class="ml-auto font-jost font-semibold tabular-nums">
                  {formatInteger(segment.value)}
                </span>
              </li>
            )}
          </For>
        </ul>
      </div>
    </section>
  )
}

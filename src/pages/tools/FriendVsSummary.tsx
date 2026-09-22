import { Swords } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createMemo, For } from 'solid-js'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import type { FriendScoreComparisonResponseDTO } from '../../types/api'
import { summarizeFriendVsMatches } from '../../utils/friendVs'
import { formatInteger } from '../../utils/numberFormat'
import { FRIEND_VS_COPY } from './friendVs.constants'

/**
 * 双方が挑戦した譜面の勝敗と、全譜面の挑戦状況を表示する。
 *
 * @param props - 比較APIの譜面別結果と対戦者。
 * @returns 自分視点の WIN・DRAW・LOSE と挑戦状況。
 */
export const FriendVsSummary = (props: {
  comparison: FriendScoreComparisonResponseDTO
}): JSX.Element => {
  const segments = createMemo(() => [
    {
      label: FRIEND_VS_COPY.bothChallenged,
      value: props.comparison.summary.both_played,
      colorClass: 'bg-[var(--cs-color-friend-vs-both)]',
    },
    {
      label: FRIEND_VS_COPY.selfOnlyChallenged,
      value: props.comparison.summary.self_only_played,
      colorClass: 'bg-[var(--cs-color-friend-vs-self)]',
    },
    {
      label: FRIEND_VS_COPY.friendOnlyChallenged,
      value: props.comparison.summary.friend_only_played,
      colorClass: 'bg-[var(--cs-color-friend-vs-friend)]',
    },
    {
      label: FRIEND_VS_COPY.neitherChallenged,
      value: props.comparison.summary.both_unplayed,
      colorClass: 'bg-[var(--cs-color-friend-vs-neither)]',
    },
  ])
  const matches = createMemo(() => summarizeFriendVsMatches(props.comparison.items))

  return (
    <section
      aria-labelledby="friend-vs-result-title"
      class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
    >
      <div class="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
        <h2 id="friend-vs-result-title" class="text-lg font-semibold">
          {FRIEND_VS_COPY.resultTitle}
        </h2>
        <DifficultyBadge difficulty={props.comparison.difficulty} />
      </div>

      <div class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 pt-4 font-sans text-sm sm:px-6">
        <span class="font-semibold">{FRIEND_VS_COPY.you}</span>
        <Swords class="h-4 w-4 text-text-muted" aria-hidden="true" />
        <span class="min-w-0 break-words font-semibold" title={props.comparison.friend.player_name}>
          {props.comparison.friend.player_name || `@${props.comparison.friend.username}`}
        </span>
      </div>
      <div class="px-4 pt-2 text-center font-sans text-xs text-text-muted sm:px-6">
        {FRIEND_VS_COPY.matchedCharts} {formatInteger(matches().total)}
      </div>
      <dl class="grid grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] items-center gap-2 px-3 py-5 text-center sm:gap-4 sm:px-6">
        <div class="min-w-0">
          <dt class="font-sans text-xs font-semibold text-text-muted">{FRIEND_VS_COPY.win}</dt>
          <dd class="mt-1 font-jost text-3xl font-bold tabular-nums text-action-primary sm:text-4xl">
            {formatInteger(matches().selfWins)}
          </dd>
        </div>
        <div class="min-w-0 text-text-muted">
          <dt class="font-sans text-xs">{FRIEND_VS_COPY.draw}</dt>
          <dd class="mt-1 font-jost text-lg font-medium tabular-nums">
            {formatInteger(matches().draws)}
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="font-sans text-xs font-semibold text-text-muted">{FRIEND_VS_COPY.lose}</dt>
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

import { Swords } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createMemo, Show } from 'solid-js'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import type {
  FriendScoreComparisonResponseDTO,
  WorldsendFriendScoreComparisonResponseDTO,
} from '../../types/api'
import { summarizeFriendVsMatches } from '../../utils/friendVs'
import { formatInteger } from '../../utils/numberFormat'
import { FRIEND_VS_COPY } from './friendVs.constants'

/**
 * 双方が挑戦した譜面の勝敗を表示する。
 *
 * @param props - 比較APIの譜面別結果と対戦者。
 * @returns 自分視点の WIN・DRAW・LOSE。
 */
export const FriendVsSummary = (props: {
  comparison: FriendScoreComparisonResponseDTO | WorldsendFriendScoreComparisonResponseDTO
}): JSX.Element => {
  /** @returns 通常譜面の難易度。WORLD'S ENDでは null。 */
  const standardDifficulty = () =>
    props.comparison.difficulty === "WORLD'S END" ? null : props.comparison.difficulty
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
        <Show
          when={standardDifficulty()}
          fallback={<span class="font-sans text-sm font-semibold">WORLD'S END</span>}
        >
          {(difficulty) => <DifficultyBadge difficulty={difficulty()} />}
        </Show>
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
    </section>
  )
}

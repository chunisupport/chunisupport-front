import { Swords } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createMemo, For, Show } from 'solid-js'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import type {
  FriendScoreComparisonResponseDTO,
  FriendScoreComparisonResult,
  FriendScoreComparisonUserDTO,
  WorldsendFriendScoreComparisonResponseDTO,
} from '../../types/api'
import { summarizeFriendVsMatches } from '../../utils/friendVs'
import { formatInteger } from '../../utils/numberFormat'
import { FRIEND_VS_COPY, FRIEND_VS_RESULT_TONES } from './friendVs.constants'

/**
 * プレイヤー名が空のときはユーザー名を表示名にする。
 *
 * @param user - 比較対象のユーザー。
 * @returns 対戦結果に出す名前。
 */
const formatComparisonUserName = (user: FriendScoreComparisonUserDTO): string =>
  user.player_name || `@${user.username}`

/**
 * 双方が挑戦した譜面の勝敗を表示する。
 *
 * @param props - 比較APIの譜面別結果と対戦者。
 * @returns 自分視点の WIN・DRAW・LOSE と勝敗の割合バー。
 */
export const FriendVsSummary = (props: {
  comparison: FriendScoreComparisonResponseDTO | WorldsendFriendScoreComparisonResponseDTO
}): JSX.Element => {
  /** @returns 通常譜面の難易度。WORLD'S ENDでは null。 */
  const standardDifficulty = () =>
    props.comparison.difficulty === "WORLD'S END" ? null : props.comparison.difficulty
  const matches = createMemo(() => summarizeFriendVsMatches(props.comparison.items))
  /** @returns 割合バーに並べる勝敗ごとの件数。 */
  const segments = (): { result: FriendScoreComparisonResult; count: number }[] => [
    { result: 'SELF_WIN', count: matches().selfWins },
    { result: 'DRAW', count: matches().draws },
    { result: 'FRIEND_WIN', count: matches().friendWins },
  ]

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
        <span class="ml-auto font-sans text-xs text-text-muted">
          {FRIEND_VS_COPY.matchedCharts}{' '}
          <span class="font-jost text-sm font-semibold tabular-nums text-text">
            {formatInteger(matches().total)}
          </span>
        </span>
      </div>

      <dl class="grid grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] items-start gap-2 px-3 pt-4 text-center sm:gap-4 sm:px-6">
        <div class="min-w-0">
          <dt class="font-sans">
            <span
              class="block truncate text-sm font-semibold"
              title={formatComparisonUserName(props.comparison.self)}
            >
              {formatComparisonUserName(props.comparison.self)}
            </span>
            <span class="mt-2 block text-xs font-semibold text-text-muted">
              {FRIEND_VS_COPY.win}
            </span>
          </dt>
          <dd
            class={`font-jost text-3xl font-bold tabular-nums sm:text-4xl ${FRIEND_VS_RESULT_TONES.SELF_WIN.text}`}
          >
            {formatInteger(matches().selfWins)}
          </dd>
        </div>
        <div class="min-w-0 text-text-muted">
          <dt class="font-sans">
            <span class="flex h-5 items-center justify-center">
              <Swords class="h-4 w-4" aria-hidden="true" />
            </span>
            <span class="mt-2 block text-xs">{FRIEND_VS_COPY.draw}</span>
          </dt>
          <dd class="flex h-9 items-center justify-center font-jost text-lg font-medium tabular-nums sm:h-10">
            {formatInteger(matches().draws)}
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="font-sans">
            <span
              class="block truncate text-sm font-semibold"
              title={formatComparisonUserName(props.comparison.friend)}
            >
              {formatComparisonUserName(props.comparison.friend)}
            </span>
            <span class="mt-2 block text-xs font-semibold text-text-muted">
              {FRIEND_VS_COPY.lose}
            </span>
          </dt>
          <dd
            class={`font-jost text-3xl font-bold tabular-nums sm:text-4xl ${FRIEND_VS_RESULT_TONES.FRIEND_WIN.text}`}
          >
            {formatInteger(matches().friendWins)}
          </dd>
        </div>
      </dl>

      <div class="px-4 pt-3 pb-5 sm:px-6">
        <div
          class="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-surface-muted"
          aria-hidden="true"
        >
          <For each={segments()}>
            {(segment) => (
              <Show when={segment.count > 0}>
                <span
                  class={`h-full ${FRIEND_VS_RESULT_TONES[segment.result].bar}`}
                  style={{ 'flex-grow': segment.count }}
                />
              </Show>
            )}
          </For>
        </div>
      </div>
    </section>
  )
}

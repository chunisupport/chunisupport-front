import { A } from '@solidjs/router'
import { For, Show } from 'solid-js'
import type { FriendRankingEntryDTO } from '../../../types/api'
import { formatScoreHistoryDateTime } from '../../../utils/scoreHistory'
import { buildUserProfilePagePath } from '../../../utils/userProfileRoute'
import {
  FRIEND_RANKING_EMPTY_LABEL,
  FRIEND_RANKING_OVERPOWER_LABEL,
  FRIEND_RANKING_PLAYER_LABEL,
  FRIEND_RANKING_RANK_LABEL,
  FRIEND_RANKING_RATING_LABEL,
  FRIEND_RANKING_SELF_LABEL,
  SCORE_HISTORY_SCORE_LABEL,
  SCORE_HISTORY_UPDATED_AT_LABEL,
} from './constants'

type Props = {
  /** 表示対象のフレンドランキング。 */
  entries: readonly FriendRankingEntryDTO[]
}

/**
 * フレンドランキングのスコア行を表示する。
 *
 * @param props - ランキング行。
 * @returns 表示用テーブル行。
 */
const FriendRankingRow = (props: { entry: FriendRankingEntryDTO }) => (
  <tr class={props.entry.is_self ? 'bg-action-primary-muted/50' : undefined}>
    <td class="px-4 py-3 font-oswald text-lg font-semibold tabular-nums">{props.entry.rank}</td>
    <td class="px-4 py-3">
      <div class="flex min-w-44 items-center gap-2">
        <A
          href={buildUserProfilePagePath(props.entry.username, 'rating_best')}
          class="font-semibold text-action-primary hover:underline"
        >
          {props.entry.player_name}
        </A>
        <Show when={props.entry.is_self}>
          <span class="rounded-full bg-action-primary px-2 py-0.5 text-xs font-semibold text-text-inverse">
            {FRIEND_RANKING_SELF_LABEL}
          </span>
        </Show>
        <span class="text-xs text-text-muted">@{props.entry.username}</span>
      </div>
    </td>
    <td class="px-4 py-3 text-right font-oswald text-lg font-semibold tabular-nums">
      {props.entry.score.toLocaleString('ja-JP')}
    </td>
    <td class="px-4 py-3 text-right font-oswald tabular-nums">{props.entry.rating.toFixed(2)}</td>
    <td class="px-4 py-3 text-right font-oswald tabular-nums">
      {props.entry.overpower_percent.toFixed(2)}%
    </td>
    <td class="px-4 py-3 text-sm whitespace-nowrap">
      {formatScoreHistoryDateTime(props.entry.updated_at)}
    </td>
  </tr>
)

/**
 * 通常譜面のフレンドランキングを表形式で表示する。
 *
 * @param props - ランキング一覧。
 * @returns フレンドランキング表。
 */
const FriendRankingTable = (props: Props) => (
  <Show
    when={props.entries.length > 0}
    fallback={
      <div class="rounded-md border border-border bg-surface px-4 py-10 text-center text-sm text-text-muted">
        {FRIEND_RANKING_EMPTY_LABEL}
      </div>
    }
  >
    <div class="overflow-x-auto rounded-lg border border-border bg-surface">
      <table class="w-full min-w-3xl border-collapse">
        <thead class="bg-surface-muted text-left text-sm text-text-muted">
          <tr>
            <th scope="col" class="px-4 py-3">
              {FRIEND_RANKING_RANK_LABEL}
            </th>
            <th scope="col" class="px-4 py-3">
              {FRIEND_RANKING_PLAYER_LABEL}
            </th>
            <th scope="col" class="px-4 py-3 text-right">
              {SCORE_HISTORY_SCORE_LABEL}
            </th>
            <th scope="col" class="px-4 py-3 text-right">
              {FRIEND_RANKING_RATING_LABEL}
            </th>
            <th scope="col" class="px-4 py-3 text-right">
              {FRIEND_RANKING_OVERPOWER_LABEL}
            </th>
            <th scope="col" class="px-4 py-3">
              {SCORE_HISTORY_UPDATED_AT_LABEL}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <For each={props.entries}>{(entry) => <FriendRankingRow entry={entry} />}</For>
        </tbody>
      </table>
    </div>
  </Show>
)

export default FriendRankingTable

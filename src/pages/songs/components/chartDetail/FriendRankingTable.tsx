import { A } from '@solidjs/router'
import { For, Show } from 'solid-js'
import {
  RecordFullChainCell,
  RecordHardLampCell,
  RecordLampCell,
} from '../../../../components/common/record/RecordDisplayParts'
import type { FriendRankingEntryDTO, WorldsendFriendRankingEntryDTO } from '../../../../types/api'
import { buildUserProfilePagePath } from '../../../../utils/userProfileRoute'
import {
  FRIEND_RANKING_EMPTY_LABEL,
  FRIEND_RANKING_PLAYER_LABEL,
  FRIEND_RANKING_RANK_LABEL,
  SCORE_HISTORY_SCORE_LABEL,
} from './constants'

type FriendRankingTableEntry = Pick<
  FriendRankingEntryDTO | WorldsendFriendRankingEntryDTO,
  | 'rank'
  | 'username'
  | 'player_name'
  | 'score'
  | 'clear_lamp'
  | 'combo_lamp'
  | 'full_chain'
  | 'is_self'
>

type Props = {
  /** 表示対象のフレンドランキング。 */
  entries: readonly FriendRankingTableEntry[]
}

/**
 * ランキング行のランプ値を共通レコードバッジが扱える形へ変換する。
 *
 * @param entry - ランキング行。
 * @returns ランプバッジ表示用のレコード断片。
 */
const toLampRecord = (entry: FriendRankingTableEntry) => ({
  is_played: true,
  score: entry.score,
  clear_lamp: entry.clear_lamp,
  combo_lamp: entry.combo_lamp,
  full_chain: entry.full_chain,
})

/**
 * フレンドランキングのランプバッジ群を表示する。
 *
 * @param props - ランキング行。
 * @returns ランプバッジ群。
 */
const FriendRankingLampBadges = (props: { entry: FriendRankingTableEntry }) => {
  const record = () => toLampRecord(props.entry)

  return (
    <div class="flex min-h-6 items-center justify-center gap-1">
      <RecordHardLampCell record={record()} />
      <RecordLampCell record={record()} />
      <RecordFullChainCell record={record()} />
    </div>
  )
}

/**
 * フレンドランキングのスコア行を表示する。
 *
 * @param props - ランキング行。
 * @returns 表示用テーブル行。
 */
const FriendRankingRow = (props: { entry: FriendRankingTableEntry }) => (
  <tr class={props.entry.is_self ? 'bg-action-primary-muted/50' : undefined}>
    <td class="w-14 px-3 py-3 text-center font-jost text-lg font-semibold tabular-nums sm:w-20 sm:px-4">
      {props.entry.rank}
    </td>
    <td class="min-w-0 px-3 py-3 sm:px-4">
      <div class="min-w-0">
        <A
          href={buildUserProfilePagePath(props.entry.username, 'rating_best')}
          class="block truncate font-semibold text-action-primary hover:underline"
        >
          {props.entry.player_name}
        </A>
      </div>
    </td>
    <td class="w-32 px-3 py-2 text-center sm:w-44 sm:px-4">
      <div class="flex flex-col items-center gap-1">
        <span class="font-jost text-base font-semibold tabular-nums">
          {props.entry.score.toLocaleString('ja-JP')}
        </span>
        <FriendRankingLampBadges entry={props.entry} />
      </div>
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
    <div class="rounded-lg border border-border bg-surface">
      <table class="w-full table-fixed border-collapse">
        <thead class="bg-surface-muted text-center text-sm text-text-muted">
          <tr>
            <th scope="col" class="w-14 px-3 py-3 sm:w-20 sm:px-4">
              {FRIEND_RANKING_RANK_LABEL}
            </th>
            <th scope="col" class="px-3 py-3 text-left sm:px-4">
              {FRIEND_RANKING_PLAYER_LABEL}
            </th>
            <th scope="col" class="w-32 px-3 py-3 sm:w-44 sm:px-4">
              {SCORE_HISTORY_SCORE_LABEL}
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

import { Show } from 'solid-js'
import { LoadError, Loading } from '../../index'
import { FRIEND_RANKING_SECTION_LABEL } from './constants'
import FriendRankingTable, { type FriendRankingTableEntry } from './FriendRankingTable'

type Props = {
  entries: readonly FriendRankingTableEntry[]
  isLoading: boolean
  error: unknown
}

/**
 * 読み込み状態を含むフレンドランキングセクションを表示する。
 *
 * @param props - ランキング一覧と取得状態。
 * @returns フレンドランキングセクション。
 */
const FriendRankingSection = (props: Props) => (
  <section class="space-y-4">
    <h2 class="text-lg font-semibold">{FRIEND_RANKING_SECTION_LABEL}</h2>
    <Show when={!props.error} fallback={<LoadError error={props.error} />}>
      <Show when={!props.isLoading} fallback={<Loading />}>
        <FriendRankingTable entries={props.entries} />
      </Show>
    </Show>
  </section>
)

export default FriendRankingSection

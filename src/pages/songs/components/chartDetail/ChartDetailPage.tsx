import { Button } from '@kobalte/core/button'
import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { LoadError, Loading } from '../../../../components'
import type {
  FriendRankingEntryDTO,
  ScoreHistoryEntryDTO,
  WorldsendFriendRankingEntryDTO,
} from '../../../../types/api'
import { FRIEND_RANKING_SECTION_LABEL, SCORE_HISTORY_SECTION_LABEL } from './constants'
import FriendRankingTable from './FriendRankingTable'
import ScoreHistoryChart from './ScoreHistoryChart'
import ScoreHistoryTable from './ScoreHistoryTable'

type FriendRankingTableEntry = Pick<
  FriendRankingEntryDTO | WorldsendFriendRankingEntryDTO,
  'rank' | 'username' | 'player_name' | 'score' | 'is_self'
>

type Props = {
  /** 表示対象の楽曲名。 */
  title: string
  /** 表示対象のアーティスト名。 */
  artist: string
  /** 通常難易度または WORLD'S END を表すバッジ。 */
  badge: JSX.Element
  /** 楽曲詳細へ戻る操作。 */
  onBack: () => void
  /** 表示対象のスコア履歴。 */
  historyEntries: readonly ScoreHistoryEntryDTO[]
  /** スコア履歴を読み込み中か。 */
  isHistoryLoading: boolean
  /** スコア履歴の取得エラー。 */
  historyError: unknown
  /** 表示対象のフレンドランキング。 */
  friendRankingEntries: readonly FriendRankingTableEntry[]
  /** フレンドランキングを読み込み中か。 */
  isFriendRankingLoading: boolean
  /** フレンドランキングの取得エラー。 */
  friendRankingError: unknown
}

/**
 * 通常譜面と WORLD'S END で共通の譜面詳細を表示する。
 *
 * @param props - 楽曲情報、履歴、ランキングと読み込み状態。
 * @returns スコア推移とフレンドランキングを含む譜面詳細画面。
 */
const ChartDetailPage = (props: Props) => (
  <main class="mx-auto w-full max-w-5xl space-y-6 p-4">
    <Button
      type="button"
      onClick={props.onBack}
      class="cursor-pointer border-0 bg-transparent p-0 text-sm text-action-primary hover:underline"
    >
      ← 楽曲詳細へ戻る
    </Button>

    <header class="space-y-2">
      <h1 class="font-sans text-2xl font-semibold">{props.title}</h1>
      <div class="flex flex-wrap items-center gap-3 text-sm text-text-muted">
        {props.badge}
        <span class="font-sans">{props.artist}</span>
      </div>
    </header>

    <section class="space-y-4">
      <h2 class="text-lg font-semibold">{SCORE_HISTORY_SECTION_LABEL}</h2>
      <Show when={!props.historyError} fallback={<LoadError error={props.historyError} />}>
        <Show when={!props.isHistoryLoading} fallback={<Loading />}>
          <ScoreHistoryChart entries={props.historyEntries} />
          <ScoreHistoryTable entries={props.historyEntries} />
        </Show>
      </Show>
    </section>

    <section class="space-y-4">
      <h2 class="text-lg font-semibold">{FRIEND_RANKING_SECTION_LABEL}</h2>
      <Show
        when={!props.friendRankingError}
        fallback={<LoadError error={props.friendRankingError} />}
      >
        <Show when={!props.isFriendRankingLoading} fallback={<Loading />}>
          <FriendRankingTable entries={props.friendRankingEntries} />
        </Show>
      </Show>
    </section>
  </main>
)

export default ChartDetailPage

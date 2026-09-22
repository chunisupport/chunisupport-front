import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import type { FriendScoreComparisonItemDTO } from '../../types/api'
import { formatInteger } from '../../utils/numberFormat'
import { FRIEND_VS_COPY } from './friendVs.constants'

/**
 * カードと表で共通のスコア表記を表示する。
 *
 * @param props - レコード、勝者かどうか、表示サイズ。
 * @returns 未プレイの読み上げと勝者の強調を含むスコア。
 */
export const FriendVsScore = (props: {
  record: FriendScoreComparisonItemDTO['self']
  winner: boolean
  size: 'card' | 'table'
}): JSX.Element => (
  <Show
    when={props.record.is_played}
    fallback={
      <span
        class={`font-sans text-text-muted ${props.size === 'card' ? 'text-lg' : ''}`}
        title={FRIEND_VS_COPY.unplayed}
      >
        <span aria-hidden="true">{FRIEND_VS_COPY.unplayedSymbol}</span>
        <span class="sr-only">{FRIEND_VS_COPY.unplayed}</span>
      </span>
    }
  >
    <span
      class={`font-jost tabular-nums ${props.size === 'card' ? 'text-lg sm:text-xl' : ''} ${props.winner ? 'font-bold text-action-primary' : ''}`}
    >
      {formatInteger(props.record.score)}
    </span>
  </Show>
)

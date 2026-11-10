import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { RecordScoreRank } from '../../components/common/record/RecordDisplayParts'
import type { FriendVsItem } from '../../utils/friendVs'
import { formatInteger } from '../../utils/numberFormat'
import { getScoreRank } from '../../utils/scoreRank'
import { FRIEND_VS_COPY, FRIEND_VS_RESULT_TONES } from './friendVs.constants'

/**
 * カードと表で共通のスコア表記を表示する。
 *
 * @param props - 比較行、表示する側、表示サイズ。
 * @returns 未プレイの読み上げ、勝者の強調、表表示時のランクを含むスコア。
 */
export const FriendVsScore = (props: {
  item: FriendVsItem
  side: 'self' | 'friend'
  size: 'card' | 'table'
}): JSX.Element => {
  /** @returns 表示する側のレコード。 */
  const record = () => props.item[props.side]
  /** @returns 表示する側が勝っているか。 */
  const winner = () => props.item.result === (props.side === 'self' ? 'SELF_WIN' : 'FRIEND_WIN')
  /** @returns 表示サイズと勝敗に応じた文字の太さ。カードでは表より一段太くする。 */
  const scoreWeight = () => {
    if (props.size === 'card') return winner() ? 'font-extrabold' : 'font-medium'
    return winner() ? 'font-bold' : ''
  }

  return (
    <Show
      when={record().is_played}
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
      <span class="flex flex-col items-center font-jost tabular-nums">
        <span
          class={`${props.size === 'card' ? 'text-lg sm:text-xl' : 'leading-none'} ${scoreWeight()} ${winner() ? FRIEND_VS_RESULT_TONES[props.item.result].text : ''}`}
        >
          {formatInteger(record().score)}
        </span>
        <Show when={props.size === 'table'}>
          <RecordScoreRank rank={getScoreRank(record().score)} class="self-end" />
        </Show>
      </span>
    </Show>
  )
}

import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import type { FriendVsItem } from '../../utils/friendVs'
import { formatInteger } from '../../utils/numberFormat'
import { FRIEND_VS_COPY, FRIEND_VS_RESULT_TONES } from './friendVs.constants'

/**
 * カードと表で共通のスコア表記を表示する。
 *
 * @param props - 比較行、表示する側、表示サイズ。
 * @returns 未プレイの読み上げと勝者の強調を含むスコア。
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
      <span
        class={`tabular-nums ${props.size === 'card' ? 'font-oswald text-lg sm:text-xl' : 'font-jost'} ${winner() ? `font-bold ${FRIEND_VS_RESULT_TONES[props.item.result].text}` : ''}`}
      >
        {formatInteger(record().score)}
      </span>
    </Show>
  )
}

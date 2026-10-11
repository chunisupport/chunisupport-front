import { Tooltip } from '@kobalte/core/tooltip'
import { Lock } from 'lucide-solid'
import { SONG_EDIT_COPY } from '../songEditConstants'

type SongUnlockRequiredIconProps = {
  /** アイコンに追加するクラス */
  class?: string
}

/**
 * 要解禁楽曲であることを示す南京錠アイコンを表示する。
 *
 * @param props - 追加クラス。
 * @returns 読み上げ用ラベル付きの南京錠アイコン。
 */
const SongUnlockRequiredIcon = (props: SongUnlockRequiredIconProps) => (
  <Tooltip placement="bottom" gutter={4} openDelay={400}>
    <Tooltip.Trigger
      as={Lock}
      class={`h-4 w-4 shrink-0 ${props.class ?? ''}`}
      role="img"
      aria-label={SONG_EDIT_COPY.unlockRequiredLabel}
    />
    <Tooltip.Portal>
      <Tooltip.Content class="z-50 rounded-md border border-border-strong bg-surface-raised px-2 py-1 text-xs text-text shadow-lg">
        {SONG_EDIT_COPY.unlockRequiredLabel}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip>
)

export default SongUnlockRequiredIcon

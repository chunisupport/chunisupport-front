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
  <Lock
    class={`h-4 w-4 shrink-0 ${props.class ?? ''}`}
    role="img"
    aria-label={SONG_EDIT_COPY.unlockRequiredLabel}
  />
)

export default SongUnlockRequiredIcon

import { Check } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import Loading from '../Loading/Loading'
import { AppButton } from './AppButton'
import { LOCKED_SONG_TOGGLE_COPY } from './LockedSongToggle.constants'

/**
 * 通常楽曲またはULTIMAの未解禁状態を、行全体のクリックで即時に切り替える。
 *
 * @param props - 対象楽曲と種別、保存済み状態、操作可否、保存状態、行の表示内容。
 * @returns 選択状態をチェックで示す横長の未解禁選択行。
 */
export const LockedSongToggle = (props: {
  songTitle: string
  isUltima: boolean
  locked: boolean
  disabled: boolean
  busy: boolean
  onClick: () => void
  children: JSX.Element
}) => (
  <AppButton
    size="sm"
    fullWidth
    variant={props.locked ? 'primary' : 'ghost'}
    class="justify-between gap-2 rounded-none text-left font-sans focus-visible:ring-inset"
    aria-pressed={props.locked}
    aria-busy={props.busy}
    title={`${props.songTitle} ${props.locked ? LOCKED_SONG_TOGGLE_COPY.unlock : LOCKED_SONG_TOGGLE_COPY.lock}`}
    disabled={props.disabled}
    onClick={props.onClick}
  >
    <span class="sr-only">
      {props.isUltima ? LOCKED_SONG_TOGGLE_COPY.ultima : LOCKED_SONG_TOGGLE_COPY.normal}
    </span>
    {props.children}
    <span class="flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
      <Show when={!props.busy} fallback={<Loading size="inline" ariaHidden />}>
        <Check class={`size-4 ${props.locked ? 'opacity-100' : 'opacity-0'}`} />
      </Show>
    </span>
  </AppButton>
)

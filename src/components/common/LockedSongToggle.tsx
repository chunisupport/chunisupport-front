import { LockKeyhole, LockKeyholeOpen } from 'lucide-solid'
import { Show } from 'solid-js'
import Loading from '../Loading/Loading'
import { AppButton } from './AppButton'
import { LOCKED_SONG_TOGGLE_COPY } from './LockedSongToggle.constants'

/**
 * 通常楽曲またはULTIMAの未解禁状態を即時に切り替える共通ボタン。
 *
 * @param props - 対象種別、保存済み状態、操作可否、保存状態、切り替え処理。
 * @returns 状態と対象を明示する未解禁トグル。
 */
export const LockedSongToggle = (props: {
  isUltima: boolean
  locked: boolean
  disabled: boolean
  busy: boolean
  onClick: () => void
}) => (
  <AppButton
    size="sm"
    variant={props.locked ? 'primary' : 'surface'}
    class="shrink-0 focus-visible:ring-inset"
    aria-pressed={props.locked}
    aria-busy={props.busy}
    title={props.locked ? LOCKED_SONG_TOGGLE_COPY.unlock : LOCKED_SONG_TOGGLE_COPY.lock}
    disabled={props.disabled}
    onClick={props.onClick}
  >
    <Show when={!props.busy} fallback={<Loading size="inline" ariaHidden />}>
      <Show when={props.locked} fallback={<LockKeyholeOpen class="h-4 w-4" aria-hidden="true" />}>
        <LockKeyhole class="h-4 w-4" aria-hidden="true" />
      </Show>
    </Show>
    {props.isUltima ? LOCKED_SONG_TOGGLE_COPY.ultima : LOCKED_SONG_TOGGLE_COPY.normal}
  </AppButton>
)

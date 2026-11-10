import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { Loading } from '../../../components'
import { AppIconButton } from '../../../components/common/AppButton'

type Props = {
  label: string
  title: string
  pressed: boolean
  busy: boolean
  disabled: boolean
  accentBackground?: boolean
  onClick: () => void
  children: JSX.Element
}

/**
 * 楽曲設定用の正方形トグルボタンを共通スタイルで表示する。
 *
 * @param props - 設定名、状態、処理状態、操作、およびアイコン。
 * @returns 状態を支援技術へ通知するアイコンボタン。
 */
const SongSettingButton = (props: Props) => (
  <AppIconButton
    size="sm"
    tone={props.pressed && props.accentBackground ? 'primary' : 'surface'}
    class="relative shrink-0"
    aria-label={props.label}
    aria-pressed={props.pressed}
    aria-busy={props.busy}
    title={props.title}
    disabled={props.disabled}
    onClick={props.onClick}
  >
    <Show when={!props.busy} fallback={<Loading size="inline" ariaHidden />}>
      {props.children}
    </Show>
  </AppIconButton>
)

export default SongSettingButton

import type { JSX } from 'solid-js'
import { Show } from 'solid-js'

type NotificationDotProps = {
  /** ドットを表示するか。 */
  visible: boolean
  /** 追加で適用する Tailwind クラス。 */
  class?: string
}

/**
 * 未確認状態を示すアクセントカラーのドットを表示する。
 *
 * @param props - 表示状態と追加クラス。
 * @returns 通知ドット要素。
 */
export const NotificationDot = (props: NotificationDotProps): JSX.Element => (
  <Show when={props.visible}>
    <span
      aria-hidden="true"
      class={[
        'pointer-events-none absolute h-2 w-2 rounded-full bg-action-primary ring-2 ring-surface',
        props.class,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  </Show>
)

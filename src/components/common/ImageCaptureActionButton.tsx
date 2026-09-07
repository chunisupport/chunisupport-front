import { Check } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'
import { Loading } from '../Loading'
import { AppIconButton, type AppIconButtonProps } from './AppButton'

export type ImageCaptureActionButtonProps = Omit<AppIconButtonProps, 'children'> & {
  /** スクリーンリーダーとツールチップへ伝える操作名 */
  label: string
  /** 画像生成などの待ち時間中かどうか */
  busy?: boolean
  /** 完了フィードバックとしてチェックマークを出すかどうか */
  success?: boolean
  /** 通常時に表示するアイコン */
  children: JSX.Element
}

/**
 * 画像化操作をアイコン単独で表し、待ち時間はスピナー、完了時はチェックマークへ切り替える。
 *
 * @param props - 操作名、処理中・完了状態、アイコン、Kobalte Button の属性。
 * @returns 正方形の画像化操作用アイコンボタン。
 */
export const ImageCaptureActionButton = (props: ImageCaptureActionButtonProps): JSX.Element => {
  const [local, buttonProps] = splitProps(props, ['label', 'busy', 'success', 'children'])

  return (
    <AppIconButton
      {...buttonProps}
      aria-label={local.label}
      title={local.label}
      aria-busy={local.busy === true}
    >
      <Show when={!local.busy} fallback={<Loading size="inline" ariaHidden />}>
        <Show when={!local.success} fallback={<Check class="h-5 w-5" aria-hidden="true" />}>
          {local.children}
        </Show>
      </Show>
    </AppIconButton>
  )
}

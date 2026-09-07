import { Check, Image } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'
import { Loading } from '../Loading'
import { AppIconButton, type AppIconButtonProps } from './AppButton'

export type ImageCaptureActionButtonProps = Omit<AppIconButtonProps, 'children' | 'size'> & {
  /** スクリーンリーダーとツールチップへ伝える操作名 */
  label: string
  /** 画像生成などの待ち時間中かどうか */
  busy?: boolean
  /** 完了フィードバックとしてチェックマークを出すかどうか */
  success?: boolean
  /** 左に画像アイコンを並べて、操作対象が画像だと示すかどうか */
  showImageIcon?: boolean
  /** 通常時に右側へ表示する操作アイコン */
  children: JSX.Element
}

/**
 * 画像化操作をアイコン単独で表し、待ち時間は操作アイコンをスピナー、完了時はチェックマークへ切り替える。
 *
 * @param props - 操作名、処理中・完了状態、画像アイコンの有無、操作アイコン、Kobalte Button の属性。
 * @returns 画像化操作用アイコンボタン。
 */
export const ImageCaptureActionButton = (props: ImageCaptureActionButtonProps): JSX.Element => {
  const [local, buttonProps] = splitProps(props, [
    'label',
    'busy',
    'success',
    'showImageIcon',
    'children',
  ])

  return (
    <AppIconButton
      {...buttonProps}
      size={local.showImageIcon ? 'auto' : 'sm'}
      aria-label={local.label}
      title={local.label}
      aria-busy={local.busy === true}
    >
      <Show when={local.showImageIcon}>
        <Image class="h-5 w-5" aria-hidden="true" />
      </Show>
      <span class="inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <Show when={!local.busy} fallback={<Loading size="inline" ariaHidden />}>
          <Show when={!local.success} fallback={<Check class="h-5 w-5" aria-hidden="true" />}>
            {local.children}
          </Show>
        </Show>
      </span>
    </AppIconButton>
  )
}

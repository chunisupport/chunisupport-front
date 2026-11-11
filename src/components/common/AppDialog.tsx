import { Dialog } from '@kobalte/core/dialog'
import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { AppDialogHeader } from './AppDialogHeader'
import {
  type AppDialogHeight,
  type AppDialogLayer,
  type AppDialogPlacement,
  type AppDialogScroll,
  type AppDialogSize,
  appDialogBodyClass,
  appDialogContentClass,
  appDialogOverlayClass,
  guardDialogOpenChange,
} from './appDialog'

export type AppDialogProps = {
  /** ダイアログを開いている場合は true */
  open: boolean
  /** 開閉状態の変更要求。送信中の閉鎖要求は渡さない */
  onOpenChange: (open: boolean) => void
  /** 送信中の場合は true。閉鎖要求を捨て、閉じるボタンを無効化する */
  pending?: boolean
  /**
   * 背面のスクロールを止める場合は true。
   * 省略時は Kobalte の既定（modal と同じく true）。
   */
  preventScroll?: boolean
  /** 画面上の置き方。省略時は中央 */
  placement?: AppDialogPlacement
  /** 幅。省略時は md */
  size?: AppDialogSize
  /** 高さ。省略時は内容の高さ */
  height?: AppDialogHeight
  /** 重なり順。省略時は最背面の通常ダイアログ */
  layer?: AppDialogLayer
  /** 本文の選択を抑止する場合は true */
  selectNone?: boolean
  /** 枠自体の溢れを隠す場合は true */
  overflowHidden?: boolean
  /** 枠線を付ける場合は true */
  bordered?: boolean
  /** Dialog.Trigger など、ポータルの外に置く要素 */
  trigger?: JSX.Element
  /**
   * 標準ヘッダーの代わりに置くヘッダー。
   * 指定した場合は title、説明、閉じるボタン、ヘッダー操作を使わない。
   */
  header?: JSX.Element
  /** ダイアログの見出し */
  title?: JSX.Element
  /** 見出しの下余白。操作ボタンが無い見出しだけに効く */
  titleSpacing?: 'none' | 'bottom'
  /** 見出しの補足。header 指定時は使わない */
  description?: JSX.Element
  /** 補足を読み上げ専用にするか。省略時は表示する */
  descriptionVisibility?: 'visible' | 'srOnly'
  /** 表示する補足の上余白。省略時は見出しの直下 */
  descriptionSpacing?: 'tight' | 'regular'
  /** 見出し行の右側に置く操作。closeLabel がある場合は使わない */
  headerActions?: JSX.Element
  /** 右上の閉じるボタンの名前。指定するとアイコンボタンを出す */
  closeLabel?: string
  /** 閉じるボタンを無効にするか。pending のときも無効になる */
  closeDisabled?: boolean
  /**
   * 本文のスクロール。省略時は none。
   * フォームが本文とフッターを包む場合は none のまま、子要素側でスクロールする。
   */
  scroll?: AppDialogScroll
  /** スクロール本文へ追加するクラス。scroll が none のときは使わない */
  bodyClass?: string
  /** ヘッダーと本文の下に固定する操作 */
  footer?: JSX.Element
  /** 本文要素の id。トリガーの aria-controls に使う */
  contentId?: string
  /** ダイアログ本体の要素。開いた直後に本体へフォーカスする場合に使う */
  contentRef?: (element: HTMLElement) => void
  /** 開いた直後の自動フォーカス。省略時は Kobalte の既定 */
  onOpenAutoFocus?: (event: Event) => void
  /** 閉じた直後のフォーカス復帰。省略時は Kobalte がトリガーへ戻す */
  onCloseAutoFocus?: (event: Event) => void
  /** 枠の外の操作。preventDefault すると閉じない */
  onInteractOutside?: (event: Event) => void
  /** ヘッダーとフッターの間に置く内容 */
  children: JSX.Element
}

/**
 * 見出しのクラスを返す。
 *
 * @param spacing - 下余白の有無。
 * @returns 見出しのクラス。
 */
const titleClass = (spacing: AppDialogProps['titleSpacing']): string =>
  spacing === 'bottom'
    ? 'mb-4 shrink-0 text-lg font-bold text-text'
    : 'shrink-0 text-lg font-bold text-text'

/**
 * 補足のクラスを返す。
 *
 * @param visibility - 表示するか読み上げ専用か。
 * @param spacing - 表示する場合の上余白。
 * @returns 補足のクラス。
 */
const descriptionClass = (
  visibility: AppDialogProps['descriptionVisibility'],
  spacing: AppDialogProps['descriptionSpacing']
): string => {
  if (visibility === 'srOnly') return 'sr-only'
  return spacing === 'regular'
    ? 'mt-2 shrink-0 text-sm text-text-muted'
    : 'mt-1 shrink-0 text-sm text-text-muted'
}

/**
 * 汎用ダイアログのオーバーレイ、枠、ヘッダー、スクロール本文、フッターを表示する。
 * フォーカストラップ、初期フォーカス、閉じたあとのトリガーへの復帰、スクロールロックは Kobalte Dialog に任せる。
 *
 * @param props - 開閉、枠の種類、見出し、本文、フッター。
 * @returns 汎用ダイアログ。
 */
export const AppDialog = (props: AppDialogProps): JSX.Element => {
  const placement = (): AppDialogPlacement => props.placement ?? 'center'
  const size = (): AppDialogSize => props.size ?? 'md'
  const height = (): AppDialogHeight => props.height ?? 'auto'
  const layer = (): AppDialogLayer => props.layer ?? 'base'
  const scroll = (): AppDialogScroll => props.scroll ?? 'none'
  const pending = (): boolean => props.pending ?? false

  /**
   * 送信中を除いて開閉を通知する。
   *
   * @param open - ダイアログを開く場合は true。
   * @returns なし。
   */
  const requestOpenChange = (open: boolean): void => {
    guardDialogOpenChange(open, pending(), props.onOpenChange)
  }

  return (
    <Dialog open={props.open} onOpenChange={requestOpenChange} preventScroll={props.preventScroll}>
      {props.trigger}
      <Dialog.Portal>
        <Dialog.Overlay class={appDialogOverlayClass(layer())} />
        <Dialog.Content
          id={props.contentId}
          ref={(element: HTMLElement) => {
            props.contentRef?.(element)
          }}
          class={appDialogContentClass({
            placement: placement(),
            size: size(),
            height: height(),
            layer: layer(),
            selectNone: props.selectNone,
            overflowHidden: props.overflowHidden,
            bordered: props.bordered,
          })}
          onOpenAutoFocus={props.onOpenAutoFocus}
          onCloseAutoFocus={props.onCloseAutoFocus}
          onInteractOutside={props.onInteractOutside}
        >
          <Show
            when={props.header}
            fallback={
              <Show
                when={props.closeLabel}
                fallback={
                  <>
                    <Show
                      when={props.headerActions}
                      fallback={
                        <Show when={props.title}>
                          <Dialog.Title class={titleClass(props.titleSpacing)}>
                            {props.title}
                          </Dialog.Title>
                        </Show>
                      }
                    >
                      <div class="mb-4 flex shrink-0 items-center justify-between gap-3">
                        <Dialog.Title class="text-lg font-bold text-text">
                          {props.title}
                        </Dialog.Title>
                        {props.headerActions}
                      </div>
                    </Show>
                    <Show when={props.description}>
                      <Dialog.Description
                        class={descriptionClass(
                          props.descriptionVisibility,
                          props.descriptionSpacing
                        )}
                      >
                        {props.description}
                      </Dialog.Description>
                    </Show>
                  </>
                }
              >
                {(closeLabel) => (
                  <AppDialogHeader
                    title={props.title ?? ''}
                    description={props.description}
                    closeLabel={closeLabel()}
                    closeDisabled={pending() || props.closeDisabled}
                  />
                )}
              </Show>
            }
          >
            {props.header}
          </Show>

          <Show when={scroll() !== 'none'} fallback={props.children}>
            <div class={appDialogBodyClass(scroll(), props.bodyClass)}>{props.children}</div>
          </Show>

          <Show when={props.footer}>
            <div class="shrink-0">{props.footer}</div>
          </Show>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

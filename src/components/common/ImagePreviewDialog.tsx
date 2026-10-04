import { Dialog } from '@kobalte/core/dialog'
import { RotateCcw, X } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { Show } from 'solid-js'
import { Loading } from '../Loading'
import { AppButton, getAppIconButtonClass } from './AppButton'

/** プレビューダイアログの幅 */
export type ImagePreviewDialogWidth = 'md' | 'lg'

/** 幅ごとのsm以上での最大幅クラス */
const IMAGE_PREVIEW_DIALOG_WIDTH_CLASS: Record<ImagePreviewDialogWidth, string> = {
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-3xl',
}

type Props = {
  /** ダイアログを開いているか */
  open: boolean
  /** 開閉状態の変更要求を受け取る処理 */
  onOpenChange: (nextOpen: boolean) => void
  /** トリガーボタンのクラス */
  triggerClass: string
  /** トリガーボタンのアイコン */
  triggerIcon: JSX.Element
  /** トリガーボタンの文言 */
  triggerLabel: string
  /** トリガーボタンを無効にするか */
  triggerDisabled?: boolean
  /** ダイアログの幅。省略時は `md` */
  width?: ImagePreviewDialogWidth
  /** ダイアログのタイトル */
  title: string
  /** タイトル下の補足 */
  description?: string
  /** 閉じるボタンのアクセシブルな名前 */
  closeLabel: string
  /** 閉じるボタンを無効にするか */
  closeDisabled: boolean
  /** ヘッダーとプレビューの間に置く画面固有の操作 */
  controls?: JSX.Element
  /** プレビュー画像を表示できるか */
  hasPreview: boolean
  /** プレビュー領域の `aria-busy` */
  previewBusy: boolean
  /** 生成中に表示するローディングのアクセシブルな名前 */
  loadingLabel: string
  /** 画像生成のエラー文言 */
  captureError?: string
  /** 再試行ボタンの文言 */
  retryLabel: string
  /** 再試行ボタンの処理 */
  onRetry: () => void
  /** フッターの操作に紐づくエラー文言 */
  footerError?: string
  /** フッターへ置く画面固有の操作 */
  footer: JSX.Element
  /** 画面外に置く画像化対象など、Dialog.Content 内へ追加する要素 */
  captureTarget?: JSX.Element
  /** プレビュー画像。`hasPreview` が true の場合だけ表示する */
  children: JSX.Element
}

/**
 * 画像プレビュー・共有ダイアログの共通の外枠を表示する。
 *
 * 固定高さの Dialog.Content にヘッダー、スクロールするプレビュー領域、フッターを配置し、
 * プレビュー未生成時はローディング、生成失敗時はエラーと再試行ボタンを表示する。
 *
 * @param props - 開閉状態、トリガー、文言、エラー、プレビューと各スロット。
 * @returns トリガーボタンとプレビューダイアログ。
 */
export const ImagePreviewDialog: Component<Props> = (props) => (
  <Dialog open={props.open} onOpenChange={props.onOpenChange} preventScroll={false}>
    <Dialog.Trigger
      as="button"
      type="button"
      disabled={props.triggerDisabled}
      class={props.triggerClass}
    >
      {props.triggerIcon}
      <span>{props.triggerLabel}</span>
    </Dialog.Trigger>
    <Show when={props.open}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-50 bg-overlay" />
        <Dialog.Content
          class={`fixed inset-x-4 top-4 bottom-4 z-60 flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:h-[92dvh] sm:max-h-[92dvh] sm:w-[94vw] ${IMAGE_PREVIEW_DIALOG_WIDTH_CLASS[props.width ?? 'md']} sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6`}
        >
          <div class="flex shrink-0 items-start justify-between gap-4">
            <div class="min-w-0">
              <Dialog.Title class="text-lg font-bold text-text">{props.title}</Dialog.Title>
              <Show when={props.description}>
                {(description) => (
                  <Dialog.Description class="mt-1 text-sm text-text-muted">
                    {description()}
                  </Dialog.Description>
                )}
              </Show>
            </div>
            <Dialog.CloseButton
              class={getAppIconButtonClass({ tone: 'ghost', class: 'shrink-0' })}
              aria-label={props.closeLabel}
              disabled={props.closeDisabled}
            >
              <X class="h-5 w-5" aria-hidden="true" />
            </Dialog.CloseButton>
          </div>

          {props.controls}

          <div class="mt-4 min-h-0 flex-1 basis-0 overflow-hidden rounded-md bg-bg p-3">
            <div
              class="scrollbar-none h-full w-full overflow-y-auto overscroll-contain"
              aria-busy={props.previewBusy}
            >
              <Show
                when={props.hasPreview}
                fallback={
                  <div class="flex min-h-full items-center justify-center">
                    <Show
                      when={props.captureError}
                      fallback={<Loading ariaLabel={props.loadingLabel} />}
                    >
                      {(message) => (
                        <div class="flex flex-col items-center gap-3 text-center">
                          <p class="text-sm text-danger" role="alert">
                            {message()}
                          </p>
                          <AppButton
                            variant="surface"
                            size="sm"
                            leftIcon={<RotateCcw class="h-4 w-4" aria-hidden="true" />}
                            onClick={() => props.onRetry()}
                          >
                            {props.retryLabel}
                          </AppButton>
                        </div>
                      )}
                    </Show>
                  </div>
                }
              >
                {props.children}
              </Show>
            </div>
          </div>

          <div class="mt-4 flex shrink-0 flex-col items-end gap-2">
            <Show when={props.footerError}>
              {(message) => (
                <p class="text-sm text-danger" role="alert">
                  {message()}
                </p>
              )}
            </Show>
            {props.footer}
          </div>

          {props.captureTarget}
        </Dialog.Content>
      </Dialog.Portal>
    </Show>
  </Dialog>
)

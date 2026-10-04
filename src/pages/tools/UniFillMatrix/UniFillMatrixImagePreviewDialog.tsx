import { Dialog } from '@kobalte/core/dialog'
import { Download, RotateCcw, Share2, X } from 'lucide-solid'
import type { Component } from 'solid-js'
import { batch, createEffect, createSignal, onCleanup, Show, untrack } from 'solid-js'
import { Loading } from '../../../components'
import {
  AppButton,
  getAppButtonClass,
  getAppIconButtonClass,
} from '../../../components/common/AppButton'
import { SOCIAL_SHARE_TEXT } from '../../../constants/socialShare'
import { canShareFiles, downloadBlobFile } from '../../../utils/domImageCapture'
import { UNI_FILL_MATRIX_COPY } from './constants'

type Props = {
  /** プレビュー用のPNG画像を生成する処理 */
  captureImage: () => Promise<Blob>
  /** 生成した画像へ付けるファイル名を返す処理 */
  createFilename: () => string
  /** 画像化の対象がなくプレビューを開けないか */
  disabled?: boolean
  /** トリガーボタンへ追加するクラス */
  triggerClass?: string
}

/**
 * ウニ埋めマトリクス画像をプレビューし、保存または共有できるダイアログを表示する。
 *
 * ダイアログを開いた時点で画像化し、表示中の画像と保存・共有する画像を同一のファイルにする。
 *
 * @param props - 画像生成処理、ファイル名生成処理、トリガーの無効状態とクラス。
 * @returns 画像化プレビューを開くボタンとダイアログ。
 */
export const UniFillMatrixImagePreviewDialog: Component<Props> = (props) => {
  const [open, setOpen] = createSignal(false)
  const [isCapturing, setIsCapturing] = createSignal(false)
  const [isSharing, setIsSharing] = createSignal(false)
  const [preview, setPreview] = createSignal<{ file: File; url: string }>()
  const [captureError, setCaptureError] = createSignal<string>()
  const [shareError, setShareError] = createSignal<string>()
  let captureRevision = 0

  /**
   * プレビュー用Object URLを破棄する。
   *
   * @returns なし。
   */
  const revokePreview = (): void => {
    const current = preview()
    if (current) URL.revokeObjectURL(current.url)
    setPreview(undefined)
  }

  /**
   * ダイアログの開閉状態を更新し、一時画像とエラーを破棄する。
   *
   * @param nextOpen - 次のダイアログ開閉状態。
   * @returns なし。
   */
  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen && isSharing()) return

    batch(() => {
      captureRevision += 1
      revokePreview()
      setCaptureError(undefined)
      setShareError(undefined)
      setIsCapturing(false)
      setOpen(nextOpen)
    })
  }

  /**
   * マトリクスをPNGへ変換し、ファイル名付きのプレビューを生成する。
   *
   * @returns プレビュー生成処理の完了時に解決されるPromise。
   */
  const capturePreview = async (): Promise<void> => {
    const revision = ++captureRevision
    setIsCapturing(true)
    setCaptureError(undefined)

    try {
      const blob = await props.captureImage()
      if (revision !== captureRevision) return
      const file = new File([blob], props.createFilename(), { type: blob.type })
      setPreview({ file, url: URL.createObjectURL(file) })
    } catch {
      if (revision === captureRevision) setCaptureError(UNI_FILL_MATRIX_COPY.imageSaveError)
    } finally {
      if (revision === captureRevision) setIsCapturing(false)
    }
  }

  /**
   * プレビュー中の画像をWeb Share APIで共有する。
   *
   * @param file - 共有する画像ファイル。
   * @returns 共有処理の完了時に解決されるPromise。
   */
  const shareImage = async (file: File): Promise<void> => {
    if (isSharing()) return

    setIsSharing(true)
    setShareError(undefined)
    try {
      await navigator.share({
        files: [file],
        text: SOCIAL_SHARE_TEXT,
        title: UNI_FILL_MATRIX_COPY.imagePreviewTitle,
      })
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setShareError(UNI_FILL_MATRIX_COPY.imageShareError)
      }
    } finally {
      setIsSharing(false)
    }
  }

  onCleanup(() => {
    captureRevision += 1
    revokePreview()
  })

  createEffect(() => {
    if (!open() || preview() || captureError() || isCapturing()) return

    untrack(() => void capturePreview())
  })

  return (
    <Dialog open={open()} onOpenChange={handleOpenChange} preventScroll={false}>
      <Dialog.Trigger
        as="button"
        type="button"
        disabled={props.disabled}
        class={getAppButtonClass({ variant: 'primary', class: props.triggerClass })}
      >
        <Share2 class="h-4 w-4" aria-hidden="true" />
        <span>{UNI_FILL_MATRIX_COPY.imageSaveLabel}</span>
      </Dialog.Trigger>
      <Show when={open()}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-50 bg-overlay" />
          <Dialog.Content class="fixed inset-x-4 top-4 bottom-4 z-60 flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:h-[92dvh] sm:max-h-[92dvh] sm:w-[94vw] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
            <div class="flex shrink-0 items-start justify-between gap-4">
              <Dialog.Title class="min-w-0 text-lg font-bold text-text">
                {UNI_FILL_MATRIX_COPY.imagePreviewTitle}
              </Dialog.Title>
              <Dialog.CloseButton
                class={getAppIconButtonClass({ tone: 'ghost', class: 'shrink-0' })}
                aria-label={UNI_FILL_MATRIX_COPY.closeImagePreview}
                disabled={isSharing()}
              >
                <X class="h-5 w-5" aria-hidden="true" />
              </Dialog.CloseButton>
            </div>

            <div class="mt-4 min-h-0 flex-1 basis-0 overflow-hidden rounded-md bg-bg p-3">
              <div
                class="scrollbar-none h-full w-full overflow-y-auto overscroll-contain"
                aria-busy={isCapturing()}
              >
                <Show
                  when={preview()}
                  fallback={
                    <div class="flex min-h-full items-center justify-center">
                      <Show
                        when={captureError()}
                        fallback={<Loading ariaLabel={UNI_FILL_MATRIX_COPY.imageCapturingLabel} />}
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
                              onClick={() => setCaptureError(undefined)}
                            >
                              {UNI_FILL_MATRIX_COPY.retryImagePreview}
                            </AppButton>
                          </div>
                        )}
                      </Show>
                    </div>
                  }
                >
                  {(image) => (
                    <img
                      src={image().url}
                      alt={UNI_FILL_MATRIX_COPY.imagePreviewAlt}
                      class="mx-auto h-auto w-full max-w-full shadow-sm [-webkit-touch-callout:default]"
                    />
                  )}
                </Show>
              </div>
            </div>

            <div class="mt-4 flex shrink-0 flex-col items-end gap-2">
              <Show when={shareError()}>
                {(message) => (
                  <p class="text-sm text-danger" role="alert">
                    {message()}
                  </p>
                )}
              </Show>
              <div class="flex flex-wrap justify-end gap-2">
                <AppButton
                  variant="surface"
                  size="sm"
                  disabled={!preview() || isSharing()}
                  onClick={() => {
                    const image = preview()
                    if (image) downloadBlobFile(image.file, image.file.name)
                  }}
                  leftIcon={<Download class="h-4 w-4" aria-hidden="true" />}
                >
                  {UNI_FILL_MATRIX_COPY.downloadImage}
                </AppButton>
                <Show when={preview()}>
                  {(image) => (
                    <Show when={canShareFiles([image().file])}>
                      <AppButton
                        variant="primary"
                        size="sm"
                        disabled={isSharing()}
                        aria-busy={isSharing()}
                        onClick={() => void shareImage(image().file)}
                        leftIcon={
                          <span class="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                            <Show
                              when={!isSharing()}
                              fallback={<Loading size="inline" ariaHidden />}
                            >
                              <Share2 class="h-4 w-4" aria-hidden="true" />
                            </Show>
                          </span>
                        }
                      >
                        {UNI_FILL_MATRIX_COPY.shareImage}
                      </AppButton>
                    </Show>
                  )}
                </Show>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Show>
    </Dialog>
  )
}

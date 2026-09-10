import { Dialog } from '@kobalte/core/dialog'
import { RotateCcw, Share2, X } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createSignal, onCleanup, Show, untrack } from 'solid-js'
import { Loading } from '../../components'
import {
  AppButton,
  getAppButtonClass,
  getAppIconButtonClass,
} from '../../components/common/AppButton'
import { SOCIAL_SHARE_TEXT } from '../../constants/socialShare'
import { canShareFiles } from '../../utils/domImageCapture'
import { REGISTER_SCORE_COPY } from './constants'

type Props = {
  /** プレビュー用画像を生成する処理 */
  captureImage: () => Promise<Blob>
  /** 共有するJPEG画像のファイル名 */
  imageFilename: string
}

/**
 * 更新差分を実画像でプレビューし、JPEGとして共有できるダイアログを表示する。
 *
 * @param props - 画像生成処理と共有ファイル名。
 * @returns 画像化・共有ボタンとプレビューダイアログ。
 */
export const RegisterScoreImagePreviewDialog: Component<Props> = (props) => {
  const [open, setOpen] = createSignal(false)
  const [isCapturingPreview, setIsCapturingPreview] = createSignal(false)
  const [isSharing, setIsSharing] = createSignal(false)
  const [previewBlob, setPreviewBlob] = createSignal<Blob>()
  const [previewUrl, setPreviewUrl] = createSignal<string>()
  const [imageActionError, setImageActionError] = createSignal<string>()
  let captureRevision = 0

  /**
   * プレビュー生成または共有を実行中か返す。
   *
   * @returns 画像に関する処理を実行中の場合はtrue。
   */
  const isImageActionRunning = (): boolean => isCapturingPreview() || isSharing()

  /**
   * 現在のブラウザがJPEGファイルの共有に対応しているか返す。
   *
   * @returns Web Share APIでJPEGファイルを共有できる場合はtrue。
   */
  const canShareReportImage = (): boolean =>
    canShareFiles([new File([], 'share-test.jpg', { type: 'image/jpeg' })])

  /**
   * プレビュー用Object URLとBlobを破棄する。
   *
   * @returns なし。
   */
  const revokePreview = (): void => {
    const objectUrl = previewUrl()
    if (objectUrl) URL.revokeObjectURL(objectUrl)

    setPreviewUrl(undefined)
    setPreviewBlob(undefined)
  }

  /**
   * ダイアログの開閉状態を更新し、一時画像とエラーを破棄する。
   *
   * @param nextOpen - 次のダイアログ開閉状態。
   * @returns なし。
   */
  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen && isImageActionRunning()) return

    captureRevision += 1
    revokePreview()
    setImageActionError(undefined)
    setOpen(nextOpen)
  }

  /**
   * 現在の更新差分をJPEGへ変換し、プレビュー用Object URLを生成する。
   *
   * @returns プレビュー生成処理の完了時に解決されるPromise。
   */
  const capturePreviewImage = async (): Promise<void> => {
    if (!open() || isCapturingPreview()) return

    const revision = ++captureRevision
    setIsCapturingPreview(true)
    setImageActionError(undefined)

    try {
      const blob = await props.captureImage()
      if (revision !== captureRevision || !open()) return

      const objectUrl = URL.createObjectURL(blob)
      if (revision !== captureRevision || !open()) {
        URL.revokeObjectURL(objectUrl)
        return
      }

      setPreviewBlob(blob)
      setPreviewUrl(objectUrl)
    } catch {
      if (revision === captureRevision) {
        setImageActionError(REGISTER_SCORE_COPY.imagePreviewError)
      }
    } finally {
      if (revision === captureRevision) setIsCapturingPreview(false)
    }
  }

  /**
   * プレビュー生成に失敗した画像化を再試行する。
   *
   * @returns なし。
   */
  const retryPreviewCapture = (): void => {
    if (open() && !isImageActionRunning() && !previewUrl()) {
      void capturePreviewImage()
    }
  }

  /**
   * プレビュー表示中の画像をWeb Share APIで共有する。
   *
   * @returns 共有処理の完了時に解決されるPromise。
   */
  const shareReportImage = async (): Promise<void> => {
    const blob = previewBlob()
    if (!blob || isImageActionRunning()) return

    const imageFile = new File([blob], props.imageFilename, { type: 'image/jpeg' })
    if (!canShareFiles([imageFile])) {
      setImageActionError(REGISTER_SCORE_COPY.shareImageError)
      return
    }

    setIsSharing(true)
    setImageActionError(undefined)

    try {
      await navigator.share({
        files: [imageFile],
        text: SOCIAL_SHARE_TEXT,
        title: REGISTER_SCORE_COPY.reportTitle,
      })
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setImageActionError(REGISTER_SCORE_COPY.shareImageError)
      }
    } finally {
      setIsSharing(false)
    }
  }

  onCleanup(() => {
    captureRevision += 1
    const objectUrl = previewUrl()
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  })

  // ダイアログが開いた後に、表示用と共有用で共通の実画像を1度だけ生成する。
  createEffect(() => {
    if (!open() || previewUrl() || imageActionError() || isCapturingPreview()) return

    untrack(() => void capturePreviewImage())
  })

  return (
    <Dialog open={open()} onOpenChange={handleOpenChange} preventScroll={false}>
      <Dialog.Trigger
        as="button"
        type="button"
        class={getAppButtonClass({
          variant: 'primary',
          shape: 'pill',
          class: 'h-10 focus-visible:ring-offset-2',
        })}
      >
        <Share2 class="h-5 w-5" aria-hidden="true" />
        <span>{REGISTER_SCORE_COPY.openImagePreview}</span>
      </Dialog.Trigger>
      <Show when={open()}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-50 bg-overlay" />
          <Dialog.Content class="fixed inset-x-4 top-4 bottom-4 z-60 flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:h-[92dvh] sm:max-h-[92dvh] sm:w-[94vw] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
            <div class="flex shrink-0 items-start justify-between gap-4">
              <div class="min-w-0">
                <Dialog.Title class="text-lg font-bold text-text">
                  {REGISTER_SCORE_COPY.imagePreviewDialogTitle}
                </Dialog.Title>
                <Dialog.Description class="mt-1 text-sm text-text-muted">
                  {REGISTER_SCORE_COPY.imagePreviewDialogDescription}
                </Dialog.Description>
              </div>
              <Dialog.CloseButton
                class={getAppIconButtonClass({ tone: 'ghost', class: 'shrink-0' })}
                aria-label={REGISTER_SCORE_COPY.closeImagePreview}
                disabled={isImageActionRunning()}
              >
                <X class="h-5 w-5" aria-hidden="true" />
              </Dialog.CloseButton>
            </div>

            <div class="mt-4 min-h-0 flex-1 basis-0 overflow-hidden rounded-md bg-bg p-3">
              <div
                class="scrollbar-none h-full w-full overflow-y-auto overscroll-contain"
                aria-busy={isCapturingPreview()}
              >
                <Show
                  when={previewUrl()}
                  fallback={
                    <div class="flex min-h-full items-center justify-center">
                      <Show
                        when={!imageActionError()}
                        fallback={
                          <div class="flex flex-col items-center gap-3 text-center">
                            <p class="text-sm text-danger" role="alert">
                              {imageActionError()}
                            </p>
                            <AppButton
                              variant="surface"
                              size="sm"
                              leftIcon={<RotateCcw class="h-4 w-4" aria-hidden="true" />}
                              onClick={retryPreviewCapture}
                            >
                              {REGISTER_SCORE_COPY.retryImagePreview}
                            </AppButton>
                          </div>
                        }
                      >
                        <Loading ariaLabel={REGISTER_SCORE_COPY.preparingImagePreview} />
                      </Show>
                    </div>
                  }
                >
                  {(objectUrl) => (
                    <img
                      src={objectUrl()}
                      alt={REGISTER_SCORE_COPY.imagePreviewAlt}
                      class="h-auto w-full max-w-full shadow-sm [-webkit-touch-callout:default]"
                    />
                  )}
                </Show>
              </div>
            </div>

            <div class="mt-4 flex shrink-0 flex-col items-end gap-2">
              <Show when={previewUrl() && imageActionError()}>
                {(message) => (
                  <p class="text-sm text-danger" role="alert">
                    {message()}
                  </p>
                )}
              </Show>
              <AppButton
                variant="primary"
                size="sm"
                disabled={!canShareReportImage() || isImageActionRunning() || !previewUrl()}
                aria-busy={isSharing()}
                onClick={() => void shareReportImage()}
                leftIcon={
                  <span class="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                    <Show when={!isSharing()} fallback={<Loading size="inline" ariaHidden />}>
                      <Share2 class="h-5 w-5" aria-hidden="true" />
                    </Show>
                  </span>
                }
              >
                {REGISTER_SCORE_COPY.shareImage}
              </AppButton>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Show>
    </Dialog>
  )
}

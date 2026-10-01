import { Dialog } from '@kobalte/core/dialog'
import { Download, RotateCcw, Share2, X } from 'lucide-solid'
import type { Component } from 'solid-js'
import { batch, createEffect, createSignal, For, onCleanup, Show, untrack } from 'solid-js'
import { Loading } from '../../components'
import {
  AppButton,
  getAppButtonClass,
  getAppIconButtonClass,
} from '../../components/common/AppButton'
import { SegmentedToggleGroup } from '../../components/common/AppTabs'
import { SOCIAL_SHARE_TEXT } from '../../constants/socialShare'
import { canShareFiles, downloadBlobFile } from '../../utils/domImageCapture'
import { REGISTER_SCORE_COPY } from './constants'
import type {
  RegisterScoreImageCaptureResult,
  RegisterScoreImageLayout,
} from './registerScoreImageCapture'
import { createRegisterScoreImageFiles } from './registerScoreImageFiles'

type Props = {
  /** プレビュー用画像を生成する処理 */
  captureImages: (layout: RegisterScoreImageLayout) => Promise<RegisterScoreImageCaptureResult>
  /** 共有するJPEG画像のファイル名 */
  imageFilename: string
}

/**
 * 更新差分の全ページをプレビューし、まとめて共有または個別に保存する。
 *
 * @param props - 画像生成処理と共有ファイル名。
 * @returns 画像化・共有ボタンとプレビューダイアログ。
 */
export const RegisterScoreImagePreviewDialog: Component<Props> = (props) => {
  const [open, setOpen] = createSignal(false)
  const [isCapturingPreview, setIsCapturingPreview] = createSignal(false)
  const [isSharing, setIsSharing] = createSignal(false)
  const [previewImages, setPreviewImages] = createSignal<{ file: File; url: string }[]>([])
  const [imageActionError, setImageActionError] = createSignal<string>()
  const [shareErrorPage, setShareErrorPage] = createSignal<number>()
  const [imageLayout, setImageLayout] = createSignal<RegisterScoreImageLayout>('split')
  const [splitPageCount, setSplitPageCount] = createSignal<number>()
  let captureRevision = 0

  /**
   * プレビュー生成または共有を実行中か返す。
   *
   * @returns 画像に関する処理を実行中の場合はtrue。
   */
  const isImageActionRunning = (): boolean => isCapturingPreview() || isSharing()

  /**
   * 生成した全ページを1回で共有できるか返す。
   *
   * @returns Web Share APIでJPEGファイルを共有できる場合はtrue。
   */
  const canShareReportImages = (): boolean =>
    previewImages().length > 0 && canShareFiles(previewImages().map((image) => image.file))

  /**
   * プレビュー用Object URLとBlobを破棄する。
   *
   * @returns なし。
   */
  const revokePreview = (): void => {
    for (const image of previewImages()) URL.revokeObjectURL(image.url)
    setPreviewImages([])
  }

  /**
   * ダイアログの開閉状態を更新し、一時画像とエラーを破棄する。
   *
   * @param nextOpen - 次のダイアログ開閉状態。
   * @returns なし。
   */
  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen && isImageActionRunning()) return

    batch(() => {
      captureRevision += 1
      revokePreview()
      setImageActionError(undefined)
      setShareErrorPage(undefined)
      setImageLayout('split')
      setSplitPageCount(undefined)
      setOpen(nextOpen)
    })
  }

  /**
   * 出力形式を切り替え、旧プレビューを破棄して画像を再生成する。
   *
   * @param layout - 次に生成する画像の出力形式。
   * @returns なし。
   */
  const changeImageLayout = (layout: RegisterScoreImageLayout): void => {
    if (isImageActionRunning() || layout === imageLayout()) return
    batch(() => {
      captureRevision += 1
      setImageLayout(layout)
      revokePreview()
      setImageActionError(undefined)
      setShareErrorPage(undefined)
    })
  }

  /**
   * 現在の更新差分をページ順のJPEGへ変換し、全ページのObject URLを生成する。
   *
   * @returns プレビュー生成処理の完了時に解決されるPromise。
   */
  const capturePreviewImage = async (): Promise<void> => {
    if (!open() || isCapturingPreview()) return

    const revision = ++captureRevision
    setIsCapturingPreview(true)
    setImageActionError(undefined)

    try {
      const { blobs, splitPageCount: pageCount } = await props.captureImages(imageLayout())
      if (revision !== captureRevision || !open()) return
      setSplitPageCount(pageCount)
      const images: { file: File; url: string }[] = []
      try {
        for (const file of createRegisterScoreImageFiles(blobs, props.imageFilename)) {
          images.push({ file, url: URL.createObjectURL(file) })
        }
        setPreviewImages(images)
      } catch (error) {
        for (const image of images) URL.revokeObjectURL(image.url)
        throw error
      }
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
    if (open() && !isImageActionRunning() && previewImages().length === 0) {
      void capturePreviewImage()
    }
  }

  /**
   * 生成済みの全ページまたは指定ページをユーザー操作で共有する。
   *
   * @param pageIndex - 個別共有するページ。省略すると全ページを共有する。
   * @returns 共有処理の完了時に解決されるPromise。
   */
  const shareReportImages = async (pageIndex?: number): Promise<void> => {
    if (previewImages().length === 0 || isImageActionRunning()) return
    const files =
      pageIndex === undefined
        ? previewImages().map((image) => image.file)
        : [previewImages()[pageIndex].file]
    setShareErrorPage(pageIndex)
    if (!canShareFiles(files)) {
      setImageActionError(REGISTER_SCORE_COPY.shareImageError)
      return
    }

    setIsSharing(true)
    setImageActionError(undefined)

    try {
      await navigator.share({
        files,
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
    revokePreview()
  })

  createEffect(() => {
    if (!open() || previewImages().length > 0 || imageActionError() || isCapturingPreview()) return

    untrack(() => void capturePreviewImage())
  })

  return (
    <Dialog open={open()} onOpenChange={handleOpenChange} preventScroll={false}>
      <Dialog.Trigger
        as="button"
        type="button"
        class={getAppButtonClass({
          variant: 'primary',
          shape: 'rounded',
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

            <div class="mt-4 shrink-0">
              <SegmentedToggleGroup
                ariaLabel={REGISTER_SCORE_COPY.imageLayout}
                value={imageLayout()}
                onChange={changeImageLayout}
                options={[
                  {
                    value: 'split',
                    label:
                      splitPageCount() === undefined
                        ? REGISTER_SCORE_COPY.splitImagesPending
                        : `${splitPageCount()}${REGISTER_SCORE_COPY.splitImagesSuffix}`,
                    disabled: isImageActionRunning(),
                  },
                  {
                    value: 'single',
                    label: REGISTER_SCORE_COPY.combineImage,
                    disabled: isImageActionRunning(),
                  },
                ]}
              />
            </div>

            <div class="mt-4 min-h-0 flex-1 basis-0 overflow-hidden rounded-md bg-bg p-3">
              <div
                class="scrollbar-none h-full w-full overflow-y-auto overscroll-contain"
                aria-busy={isCapturingPreview()}
              >
                <Show
                  when={previewImages().length > 0}
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
                  <div class="flex flex-col gap-4">
                    <For each={previewImages()}>
                      {(image, index) => (
                        <div class="flex flex-col gap-2">
                          <img
                            src={image.url}
                            alt={`${REGISTER_SCORE_COPY.imagePreviewAlt} ${index() + 1} / ${previewImages().length}`}
                            class="h-auto w-full max-w-full shadow-sm [-webkit-touch-callout:default]"
                          />
                          <div class="flex justify-end gap-2">
                            <Show when={!canShareReportImages() && canShareFiles([image.file])}>
                              <AppButton
                                variant="surface"
                                size="sm"
                                class="focus-visible:ring-inset"
                                disabled={isImageActionRunning()}
                                onClick={() => void shareReportImages(index())}
                                leftIcon={<Share2 class="h-4 w-4" aria-hidden="true" />}
                              >
                                {REGISTER_SCORE_COPY.shareImage}
                              </AppButton>
                            </Show>
                            <AppButton
                              variant="surface"
                              size="sm"
                              class="focus-visible:ring-inset"
                              disabled={isImageActionRunning()}
                              onClick={() => downloadBlobFile(image.file, image.file.name)}
                              leftIcon={<Download class="h-4 w-4" aria-hidden="true" />}
                            >
                              {REGISTER_SCORE_COPY.downloadImage}
                            </AppButton>
                          </div>
                          <Show when={shareErrorPage() === index() && imageActionError()}>
                            {(message) => (
                              <p class="text-sm text-danger" role="alert">
                                {message()}
                              </p>
                            )}
                          </Show>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </div>

            <div class="mt-4 flex shrink-0 flex-col items-end gap-2">
              <Show
                when={
                  previewImages().length > 0 && shareErrorPage() === undefined && imageActionError()
                }
              >
                {(message) => (
                  <p class="text-sm text-danger" role="alert">
                    {message()}
                  </p>
                )}
              </Show>
              <Show when={canShareReportImages()}>
                <AppButton
                  variant="primary"
                  size="sm"
                  disabled={isImageActionRunning()}
                  aria-busy={isSharing()}
                  onClick={() => void shareReportImages()}
                  leftIcon={
                    <span class="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                      <Show when={!isSharing()} fallback={<Loading size="inline" ariaHidden />}>
                        <Share2 class="h-5 w-5" aria-hidden="true" />
                      </Show>
                    </span>
                  }
                >
                  {previewImages().length > 1
                    ? REGISTER_SCORE_COPY.shareAllImages
                    : REGISTER_SCORE_COPY.shareImage}
                </AppButton>
              </Show>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Show>
    </Dialog>
  )
}

import { Download, Share2 } from 'lucide-solid'
import type { Component } from 'solid-js'
import { batch, createSignal, For, Show } from 'solid-js'
import { Loading } from '../../components'
import { AppButton, getAppButtonClass } from '../../components/common/AppButton'
import { SegmentedToggleGroup } from '../../components/common/AppTabs'
import { ImagePreviewDialog } from '../../components/common/ImagePreviewDialog'
import { createImagePreview } from '../../hooks/createImagePreview'
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
  const [shareErrorPage, setShareErrorPage] = createSignal<number>()
  const [imageLayout, setImageLayout] = createSignal<RegisterScoreImageLayout>('split')
  const [splitPageCount, setSplitPageCount] = createSignal<number>()

  const preview = createImagePreview({
    capture: () => props.captureImages(imageLayout()),
    toFiles: ({ blobs, splitPageCount: pageCount }) => {
      setSplitPageCount(pageCount)
      return createRegisterScoreImageFiles(blobs, props.imageFilename)
    },
    lockCloseWhileCapturing: true,
    onOpenChange: () => {
      setShareErrorPage(undefined)
      setImageLayout('split')
      setSplitPageCount(undefined)
    },
    captureErrorMessage: REGISTER_SCORE_COPY.imagePreviewError,
    shareErrorMessage: REGISTER_SCORE_COPY.shareImageError,
    shareTitle: REGISTER_SCORE_COPY.reportTitle,
  })

  /**
   * 生成した全ページを1回で共有できるか返す。
   *
   * @returns Web Share APIでJPEGファイルを共有できる場合はtrue。
   */
  const canShareReportImages = (): boolean =>
    preview.previews().length > 0 && canShareFiles(preview.previews().map((image) => image.file))

  /**
   * 出力形式を切り替え、旧プレビューを破棄して画像を再生成する。
   *
   * @param layout - 次に生成する画像の出力形式。
   * @returns なし。
   */
  const changeImageLayout = (layout: RegisterScoreImageLayout): void => {
    if (preview.isBusy() || layout === imageLayout()) return
    batch(() => {
      preview.reset()
      setImageLayout(layout)
      setShareErrorPage(undefined)
    })
  }

  /**
   * 生成済みの全ページまたは指定ページをユーザー操作で共有する。
   *
   * @param pageIndex - 個別共有するページ。省略すると全ページを共有する。
   * @returns なし。
   */
  const shareReportImages = (pageIndex?: number): void => {
    const images = preview.previews()
    if (images.length === 0 || preview.isBusy()) return
    const files =
      pageIndex === undefined ? images.map((image) => image.file) : [images[pageIndex].file]
    setShareErrorPage(pageIndex)
    void preview.share(files)
  }

  return (
    <ImagePreviewDialog
      open={preview.open()}
      onOpenChange={preview.handleOpenChange}
      triggerClass={getAppButtonClass({
        variant: 'primary',
        shape: 'rounded',
        class: 'h-10 focus-visible:ring-offset-2',
      })}
      triggerIcon={<Share2 class="h-5 w-5" aria-hidden="true" />}
      triggerLabel={REGISTER_SCORE_COPY.openImagePreview}
      title={REGISTER_SCORE_COPY.imagePreviewDialogTitle}
      description={REGISTER_SCORE_COPY.imagePreviewDialogDescription}
      closeLabel={REGISTER_SCORE_COPY.closeImagePreview}
      closeDisabled={preview.isCloseLocked()}
      controls={
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
                disabled: preview.isBusy(),
              },
              {
                value: 'single',
                label: REGISTER_SCORE_COPY.combineImage,
                disabled: preview.isBusy(),
              },
            ]}
          />
        </div>
      }
      hasPreview={preview.previews().length > 0}
      previewBusy={preview.isCapturing()}
      loadingLabel={REGISTER_SCORE_COPY.preparingImagePreview}
      captureError={preview.captureError()}
      retryLabel={REGISTER_SCORE_COPY.retryImagePreview}
      onRetry={preview.retryCapture}
      footerError={shareErrorPage() === undefined ? preview.shareError() : undefined}
      footer={
        <Show when={canShareReportImages()}>
          <AppButton
            variant="primary"
            size="sm"
            disabled={preview.isBusy()}
            aria-busy={preview.isSharing()}
            onClick={() => shareReportImages()}
            leftIcon={
              <span class="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                <Show when={!preview.isSharing()} fallback={<Loading size="inline" ariaHidden />}>
                  <Share2 class="h-5 w-5" aria-hidden="true" />
                </Show>
              </span>
            }
          >
            {preview.previews().length > 1
              ? REGISTER_SCORE_COPY.shareAllImages
              : REGISTER_SCORE_COPY.shareImage}
          </AppButton>
        </Show>
      }
    >
      <div class="flex flex-col gap-4">
        <For each={preview.previews()}>
          {(image, index) => (
            <div class="flex flex-col gap-2">
              <img
                src={image.url}
                alt={`${REGISTER_SCORE_COPY.imagePreviewAlt} ${index() + 1} / ${preview.previews().length}`}
                class="h-auto w-full max-w-full shadow-sm [-webkit-touch-callout:default]"
              />
              <div class="flex justify-end gap-2">
                <Show when={!canShareReportImages() && canShareFiles([image.file])}>
                  <AppButton
                    variant="surface"
                    size="sm"
                    class="focus-visible:ring-inset"
                    disabled={preview.isBusy()}
                    onClick={() => shareReportImages(index())}
                    leftIcon={<Share2 class="h-4 w-4" aria-hidden="true" />}
                  >
                    {REGISTER_SCORE_COPY.shareImage}
                  </AppButton>
                </Show>
                <AppButton
                  variant="surface"
                  size="sm"
                  class="focus-visible:ring-inset"
                  disabled={preview.isBusy()}
                  onClick={() => downloadBlobFile(image.file, image.file.name)}
                  leftIcon={<Download class="h-4 w-4" aria-hidden="true" />}
                >
                  {REGISTER_SCORE_COPY.downloadImage}
                </AppButton>
              </div>
              <Show when={shareErrorPage() === index() && preview.shareError()}>
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
    </ImagePreviewDialog>
  )
}

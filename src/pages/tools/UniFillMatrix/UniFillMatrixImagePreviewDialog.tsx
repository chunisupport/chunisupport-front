import { Download, Share2 } from 'lucide-solid'
import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import { Loading } from '../../../components'
import { AppButton, getAppButtonClass } from '../../../components/common/AppButton'
import { ImagePreviewDialog } from '../../../components/common/ImagePreviewDialog'
import { createImagePreview } from '../../../hooks/createImagePreview'
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
  const preview = createImagePreview({
    capture: () => props.captureImage(),
    toFiles: (blob) => [new File([blob], props.createFilename(), { type: blob.type })],
    captureErrorMessage: UNI_FILL_MATRIX_COPY.imageSaveError,
    shareErrorMessage: UNI_FILL_MATRIX_COPY.imageShareError,
    shareTitle: UNI_FILL_MATRIX_COPY.imagePreviewTitle,
  })

  /**
   * 生成済みのプレビュー画像を返す。
   *
   * @returns プレビュー画像。未生成の場合はundefined。
   */
  const image = () => preview.previews()[0]

  return (
    <ImagePreviewDialog
      open={preview.open()}
      onOpenChange={preview.handleOpenChange}
      triggerClass={getAppButtonClass({ variant: 'primary', class: props.triggerClass })}
      triggerIcon={<Share2 class="h-4 w-4" aria-hidden="true" />}
      triggerLabel={UNI_FILL_MATRIX_COPY.imageSaveLabel}
      triggerDisabled={props.disabled}
      width="lg"
      title={UNI_FILL_MATRIX_COPY.imagePreviewTitle}
      closeLabel={UNI_FILL_MATRIX_COPY.closeImagePreview}
      closeDisabled={preview.isCloseLocked()}
      hasPreview={image() !== undefined}
      previewBusy={preview.isCapturing()}
      loadingLabel={UNI_FILL_MATRIX_COPY.imageCapturingLabel}
      captureError={preview.captureError()}
      retryLabel={UNI_FILL_MATRIX_COPY.retryImagePreview}
      onRetry={preview.retryCapture}
      footerError={preview.shareError()}
      footer={
        <div class="flex flex-wrap justify-end gap-2">
          <AppButton
            variant="surface"
            size="sm"
            disabled={!image() || preview.isSharing()}
            onClick={() => {
              const current = image()
              if (current) downloadBlobFile(current.file, current.file.name)
            }}
            leftIcon={<Download class="h-4 w-4" aria-hidden="true" />}
          >
            {UNI_FILL_MATRIX_COPY.downloadImage}
          </AppButton>
          <Show when={image()}>
            {(current) => (
              <Show when={canShareFiles([current().file])}>
                <AppButton
                  variant="primary"
                  size="sm"
                  disabled={preview.isSharing()}
                  aria-busy={preview.isSharing()}
                  onClick={() => void preview.share([current().file])}
                  leftIcon={
                    <span class="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                      <Show
                        when={!preview.isSharing()}
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
      }
    >
      <Show when={image()}>
        {(current) => (
          <img
            src={current().url}
            alt={UNI_FILL_MATRIX_COPY.imagePreviewAlt}
            class="mx-auto h-auto w-full max-w-full shadow-sm [-webkit-touch-callout:default]"
          />
        )}
      </Show>
    </ImagePreviewDialog>
  )
}

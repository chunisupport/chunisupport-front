import { Download, Share2 } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { Show } from 'solid-js'
import { createImagePreview } from '../../hooks/createImagePreview'
import { canShareFiles, downloadBlobFile } from '../../utils/domImageCapture'
import { Loading } from '../Loading'
import { AppButton } from './AppButton'
import { ImagePreviewDialog, type ImagePreviewDialogWidth } from './ImagePreviewDialog'
import { SINGLE_IMAGE_PREVIEW_COPY } from './SingleImagePreviewDialog.constants'

type Props = {
  /** プレビュー用の画像を生成する処理 */
  captureImage: () => Promise<Blob>
  /** 生成した画像へ付けるファイル名を返す処理 */
  createFilename: () => string
  /** トリガーボタンのクラス */
  triggerClass: string
  /** トリガーボタンのアイコン */
  triggerIcon: JSX.Element
  /** トリガーボタンの文言 */
  triggerLabel: string
  /** 画像化の対象がなくプレビューを開けないか */
  disabled?: boolean
  /** ダイアログの幅。省略時は `lg` */
  width?: ImagePreviewDialogWidth
  /** ダイアログのタイトル。共有時のタイトルにも使う */
  title: string
  /** プレビュー画像の代替テキスト */
  imageAlt: string
}

/**
 * 1枚の画像をプレビューし、保存または共有できるダイアログを表示する。
 *
 * ダイアログを開いた時点で画像化し、表示中の画像と保存・共有する画像を同一のファイルにする。
 *
 * @param props - 画像生成処理、ファイル名生成処理、トリガーの表示、ダイアログの文言。
 * @returns 画像化プレビューを開くボタンとダイアログ。
 */
export const SingleImagePreviewDialog: Component<Props> = (props) => {
  const preview = createImagePreview({
    capture: () => props.captureImage(),
    toFiles: (blob) => [new File([blob], props.createFilename(), { type: blob.type })],
    captureErrorMessage: SINGLE_IMAGE_PREVIEW_COPY.captureError,
    shareErrorMessage: SINGLE_IMAGE_PREVIEW_COPY.shareError,
    shareTitle: props.title,
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
      triggerClass={props.triggerClass}
      triggerIcon={props.triggerIcon}
      triggerLabel={props.triggerLabel}
      triggerDisabled={props.disabled}
      width={props.width ?? 'lg'}
      title={props.title}
      closeLabel={SINGLE_IMAGE_PREVIEW_COPY.close}
      closeDisabled={preview.isCloseLocked()}
      hasPreview={image() !== undefined}
      previewBusy={preview.isCapturing()}
      loadingLabel={SINGLE_IMAGE_PREVIEW_COPY.capturing}
      captureError={preview.captureError()}
      retryLabel={SINGLE_IMAGE_PREVIEW_COPY.retry}
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
            {SINGLE_IMAGE_PREVIEW_COPY.download}
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
                  {SINGLE_IMAGE_PREVIEW_COPY.share}
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
            alt={props.imageAlt}
            class="mx-auto h-auto w-full max-w-full shadow-sm [-webkit-touch-callout:default]"
          />
        )}
      </Show>
    </ImagePreviewDialog>
  )
}

import { Dialog } from '@kobalte/core/dialog'
import { Download, ImageDown, X } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createSignal, onCleanup, Show } from 'solid-js'
import { Loading } from '../../../../components'
import {
  AppButton,
  getAppButtonClass,
  getAppIconButtonClass,
} from '../../../../components/common/AppButton'
import type { HonorDTO, PlayerDTO, UserRatingDTO } from '../../../../types/api'
import { captureElementAsPng, downloadBlobFile } from '../../../../utils/domImageCapture'
import {
  RATING_IMAGE_COPY,
  RATING_IMAGE_FILENAME,
  RATING_IMAGE_PIXEL_RATIO,
  RATING_IMAGE_WIDTH_PX,
} from '../UserProfileView.constants'
import { RatingImageSheet } from './RatingImageSheet'

type Props = {
  /** 画像上部へ表示するプレイヤー情報。 */
  playerInfo: PlayerDTO
  /** 画像上部へ表示する称号。 */
  honors: HonorDTO[]
  /** ベスト枠・新曲枠と集計値。 */
  rating: UserRatingDTO
  /** カード背景へジャケット画像を表示するかどうか。 */
  showJackets: boolean
}

/**
 * ベスト枠・新曲枠画像を縮小プレビューし、PNGとして保存できるダイアログを表示する。
 *
 * @param props - プレイヤー情報、称号、レーティング枠、ジャケット表示設定。
 * @returns 画像プレビューを開くボタンとダイアログ。
 */
export const RatingImagePreviewDialog: Component<Props> = (props) => {
  const [open, setOpen] = createSignal(false)
  const [isDownloading, setIsDownloading] = createSignal(false)
  const [downloadError, setDownloadError] = createSignal<string>()
  const [previewViewport, setPreviewViewport] = createSignal<HTMLDivElement>()
  const [imageSheet, setImageSheet] = createSignal<HTMLDivElement>()
  const [previewScale, setPreviewScale] = createSignal(1)
  const [previewHeight, setPreviewHeight] = createSignal(0)

  /**
   * ダイアログの開閉状態を更新し、閉じるときは一時エラーを破棄する。
   *
   * @param nextOpen - 次のダイアログ開閉状態。
   * @returns なし。
   */
  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen && isDownloading()) return

    setOpen(nextOpen)
    if (!nextOpen) setDownloadError(undefined)
  }

  /**
   * 現在のプレビュー内容を2倍解像度のPNGとしてダウンロードする。
   *
   * @returns ダウンロード処理の完了時に解決されるPromise。
   */
  const downloadRatingImage = async (): Promise<void> => {
    const sheet = imageSheet()
    if (!sheet) return

    setIsDownloading(true)
    setDownloadError(undefined)

    try {
      const blob = await captureElementAsPng(sheet, {
        pixelRatio: RATING_IMAGE_PIXEL_RATIO,
      })
      downloadBlobFile(blob, RATING_IMAGE_FILENAME)
    } catch {
      setDownloadError(RATING_IMAGE_COPY.downloadError)
    } finally {
      setIsDownloading(false)
    }
  }

  // 固定幅の画像本体をダイアログ本文の表示幅だけ縮小し、占有高さを同期する。
  createEffect(() => {
    if (!open()) return

    const viewport = previewViewport()
    const sheet = imageSheet()
    if (!viewport || !sheet) return

    /**
     * 画像本体を表示領域へ収める縮小率と、変形後の占有高さを更新する。
     *
     * @returns なし。
     */
    const updatePreviewSize = (): void => {
      const scale = Math.min(1, viewport.clientWidth / RATING_IMAGE_WIDTH_PX)
      setPreviewScale(scale)
      setPreviewHeight(sheet.offsetHeight * scale)
    }

    const resizeObserver = new ResizeObserver(updatePreviewSize)
    resizeObserver.observe(viewport)
    resizeObserver.observe(sheet)
    updatePreviewSize()

    onCleanup(() => resizeObserver.disconnect())
  })

  return (
    <Dialog open={open()} onOpenChange={handleOpenChange} preventScroll={false}>
      <Dialog.Trigger
        as="button"
        type="button"
        class={getAppButtonClass({
          variant: 'surface',
          shape: 'pill',
          class: 'h-10 focus-visible:ring-offset-2',
        })}
      >
        <ImageDown class="h-5 w-5" aria-hidden="true" />
        <span>{RATING_IMAGE_COPY.openPreview}</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-50 bg-overlay" />
        <Dialog.Content class="fixed inset-x-4 top-4 bottom-4 z-60 flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:h-[92dvh] sm:max-h-[92dvh] sm:w-[94vw] sm:max-w-6xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
          <div class="flex shrink-0 items-start justify-between gap-4">
            <div class="min-w-0">
              <Dialog.Title class="text-lg font-bold text-text">
                {RATING_IMAGE_COPY.dialogTitle}
              </Dialog.Title>
              <Dialog.Description class="mt-1 text-sm text-text-muted">
                {RATING_IMAGE_COPY.dialogDescription}
              </Dialog.Description>
            </div>
            <Dialog.CloseButton
              class={getAppIconButtonClass({ tone: 'ghost', class: 'shrink-0' })}
              aria-label={RATING_IMAGE_COPY.close}
              disabled={isDownloading()}
            >
              <X class="h-5 w-5" aria-hidden="true" />
            </Dialog.CloseButton>
          </div>

          <div class="mt-4 min-h-0 flex-1 basis-0 overflow-y-auto overscroll-contain rounded-md bg-bg p-3">
            <div
              ref={(element) => setPreviewViewport(element)}
              class="mx-auto w-full overflow-hidden"
            >
              <div
                class="relative min-h-40 overflow-hidden"
                style={{ height: `${previewHeight()}px` }}
              >
                <div
                  class="absolute left-0 top-0"
                  style={{
                    transform: `scale(${previewScale()})`,
                    'transform-origin': 'top left',
                  }}
                >
                  <RatingImageSheet
                    captureRef={(element) => setImageSheet(element)}
                    playerInfo={props.playerInfo}
                    honors={props.honors}
                    rating={props.rating}
                    showJackets={props.showJackets}
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 flex shrink-0 flex-col items-end gap-2">
            <Show when={downloadError()}>
              {(message) => (
                <p class="text-sm text-danger" role="alert">
                  {message()}
                </p>
              )}
            </Show>
            <div class="flex flex-wrap justify-end gap-2">
              <Dialog.CloseButton
                class={getAppButtonClass({ variant: 'secondary' })}
                disabled={isDownloading()}
              >
                {RATING_IMAGE_COPY.close}
              </Dialog.CloseButton>
              <AppButton
                variant="primary"
                disabled={isDownloading()}
                aria-busy={isDownloading()}
                onClick={downloadRatingImage}
                leftIcon={
                  <Show when={!isDownloading()} fallback={<Loading size="inline" ariaHidden />}>
                    <Download class="h-4 w-4" aria-hidden="true" />
                  </Show>
                }
              >
                {isDownloading() ? RATING_IMAGE_COPY.downloading : RATING_IMAGE_COPY.download}
              </AppButton>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

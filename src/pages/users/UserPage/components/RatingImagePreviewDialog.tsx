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
import { buildChunithmJacketUrl } from '../../../../utils/jacket'
import {
  RATING_IMAGE_COPY,
  RATING_IMAGE_PIXEL_RATIO,
  RATING_IMAGE_WIDTH_PX,
  RATING_SLOT_COUNT,
} from '../UserProfileView.constants'
import { RatingImageSheet } from './RatingImageSheet'
import { formatRatingImageFilename } from './ratingImageFilename'

type Props = {
  /** プロフィールURLに使用するユーザー名。 */
  username: string
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
 * @returns 画像化プレビューを開くボタンとダイアログ。
 */
export const RatingImagePreviewDialog: Component<Props> = (props) => {
  const [open, setOpen] = createSignal(false)
  const [isDownloading, setIsDownloading] = createSignal(false)
  const [downloadError, setDownloadError] = createSignal<string>()
  const [previewViewport, setPreviewViewport] = createSignal<HTMLDivElement>()
  const [imageSheet, setImageSheet] = createSignal<HTMLDivElement>()
  const [previewScale, setPreviewScale] = createSignal(1)

  const [readyJacketCount, setReadyJacketCount] = createSignal(0)
  const readyJacketKeys = new Set<string>()

  /**
   * 画像化対象に含まれる、URLが有効なジャケット画像の件数を返す。
   *
   * @returns 読み込み完了を待つジャケット画像の件数。
   */
  const expectedJacketCount = (): number => {
    if (!props.showJackets) return 0

    return [
      ...props.rating.best.slice(0, RATING_SLOT_COUNT.best),
      ...props.rating.new.slice(0, RATING_SLOT_COUNT.new),
    ].filter((record) => buildChunithmJacketUrl(record.img) !== null).length
  }

  /**
   * 全ジャケットが元画像またはプレースホルダーで表示可能になったかを返す。
   *
   * @returns プレビューを表示可能な場合はtrue。
   */
  const isPreviewReady = (): boolean => readyJacketCount() >= expectedJacketCount()

  /**
   * ジャケット画像ごとの準備状態を集約する。
   *
   * @param key - 画像化対象内でジャケット画像を識別するキー。
   * @param ready - 元画像またはプレースホルダーを表示可能かどうか。
   * @returns なし。
   */
  const handleJacketReadyChange = (key: string, ready: boolean): void => {
    if (ready) {
      readyJacketKeys.add(key)
    } else {
      readyJacketKeys.delete(key)
    }
    setReadyJacketCount(readyJacketKeys.size)
  }

  /**
   * ダイアログの開閉状態を更新し、閉じるときは一時エラーを破棄する。
   *
   * @param nextOpen - 次のダイアログ開閉状態。
   * @returns なし。
   */
  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen && isDownloading()) return

    if (nextOpen) {
      readyJacketKeys.clear()
      setReadyJacketCount(0)
    }
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
      downloadBlobFile(blob, formatRatingImageFilename(props.username))
    } catch {
      setDownloadError(RATING_IMAGE_COPY.downloadError)
    } finally {
      setIsDownloading(false)
    }
  }

  // 画像の論理サイズを保存したまま、プレビューだけをダイアログの表示領域へ収める。
  createEffect(() => {
    if (!open()) return

    const viewport = previewViewport()
    const sheet = imageSheet()
    if (!viewport || !sheet) return

    /**
     * 画像本体を表示領域の幅と高さへ収める縮小率を更新する。
     *
     * @returns なし。
     */
    let animationFrameId: number | undefined

    const updatePreviewSize = (): void => {
      if (animationFrameId !== undefined) cancelAnimationFrame(animationFrameId)

      animationFrameId = requestAnimationFrame(() => {
        const scale = Math.min(
          1,
          viewport.clientWidth / RATING_IMAGE_WIDTH_PX,
          viewport.clientHeight / sheet.offsetHeight
        )

        setPreviewScale((current) => (current === scale ? current : scale))
        animationFrameId = undefined
      })
    }

    const resizeObserver = new ResizeObserver(updatePreviewSize)
    resizeObserver.observe(viewport)
    resizeObserver.observe(sheet)
    updatePreviewSize()

    onCleanup(() => {
      resizeObserver.disconnect()
      if (animationFrameId !== undefined) cancelAnimationFrame(animationFrameId)
    })
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
      <Show when={open()}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-50 bg-overlay" />
          <Dialog.Content class="fixed inset-x-4 top-4 bottom-4 z-60 flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:h-[92dvh] sm:max-h-[92dvh] sm:w-[94vw] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
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

            <div class="mt-4 min-h-0 flex-1 basis-0 overflow-hidden rounded-md bg-bg p-3">
              <div
                ref={(element) => setPreviewViewport(element)}
                class="relative mx-auto h-full w-full overflow-hidden"
              >
                <Show when={!isPreviewReady()}>
                  <div class="absolute inset-0 z-10">
                    <Loading ariaLabel={RATING_IMAGE_COPY.preparingPreview} />
                  </div>
                </Show>
                <div
                  class="absolute left-1/2 top-1/2 select-none"
                  classList={{ invisible: !isPreviewReady() }}
                  aria-busy={!isPreviewReady()}
                  style={{
                    transform: `translate(-50%, -50%) scale(${previewScale()})`,
                    'transform-origin': 'center',
                  }}
                >
                  <RatingImageSheet
                    captureRef={(element) => setImageSheet(element)}
                    playerInfo={props.playerInfo}
                    honors={props.honors}
                    rating={props.rating}
                    showJackets={props.showJackets}
                    onJacketReadyChange={handleJacketReadyChange}
                  />
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
                  disabled={isDownloading() || !isPreviewReady()}
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
      </Show>
    </Dialog>
  )
}

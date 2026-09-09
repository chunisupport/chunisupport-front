import { Dialog } from '@kobalte/core/dialog'
import { ImageDown, RotateCcw, Share2, X } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createSignal, on, onCleanup, Show, untrack } from 'solid-js'
import { Loading } from '../../../../components'
import {
  AppButton,
  getAppButtonClass,
  getAppIconButtonClass,
} from '../../../../components/common/AppButton'
import { RATING_SLOT_COUNT } from '../../../../constants/rating'
import { SOCIAL_SHARE_TEXT } from '../../../../constants/socialShare'
import type { HonorDTO, PlayerDTO, UserRatingDTO } from '../../../../types/api'
import { canShareFiles, captureElementAsImage } from '../../../../utils/domImageCapture'
import { buildChunithmJacketUrl } from '../../../../utils/jacket'
import {
  RATING_IMAGE_COPY,
  RATING_IMAGE_JPEG_QUALITY,
  RATING_IMAGE_PIXEL_RATIO,
} from '../UserProfileView.constants'
import { RatingImageSheet } from './RatingImageSheet'
import { formatRatingImageFilename } from './ratingImageFilename'

type Props = {
  /** プロフィールURLに使用するユーザー名 */
  username: string
  /** 画像上部へ表示するプレイヤー情報 */
  playerInfo: PlayerDTO
  /** 画像上部へ表示する称号 */
  honors: HonorDTO[]
  /** ベスト枠・新曲枠と集計値 */
  rating: UserRatingDTO
  /** カード背景へジャケット画像を表示するかどうか */
  showJackets: boolean
}

/**
 * ベスト枠・新曲枠画像を実画像でプレビューし、JPEGとして共有できるダイアログを表示する。
 *
 * プレビュー表示時点で画像化を行い、表示中の画像と保存する画像を同一のBlobにする。
 * 画像表示により、スマートフォンの長押し保存など標準の画像操作を利用できる。
 *
 * @param props - プレイヤー情報、称号、レーティング枠、ジャケット表示設定。
 * @returns 画像化プレビューを開くボタンとダイアログ。
 */
export const RatingImagePreviewDialog: Component<Props> = (props) => {
  const [open, setOpen] = createSignal(false)
  const [isSharing, setIsSharing] = createSignal(false)
  const [isCapturingPreview, setIsCapturingPreview] = createSignal(false)
  const [previewBlob, setPreviewBlob] = createSignal<Blob>()
  const [previewUrl, setPreviewUrl] = createSignal<string>()
  const [imageActionError, setImageActionError] = createSignal<string>()
  const [imageSheet, setImageSheet] = createSignal<HTMLDivElement>()
  let captureRevision = 0

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
   * @returns 画像化を開始可能な場合はtrue。
   */
  const isPreviewReady = (): boolean => readyJacketCount() >= expectedJacketCount()

  /**
   * 共有またはプレビュー生成を実行中か返す。
   *
   * @returns 画像に関する処理を実行中の場合はtrue。
   */
  const isImageActionRunning = (): boolean => isSharing() || isCapturingPreview()

  /**
   * 現在のブラウザがJPEGファイルの共有に対応しているかを返す。
   *
   * @returns Web Share APIでJPEGファイルを共有できる場合はtrue。
   */
  const canShareRatingImage = (): boolean =>
    canShareFiles([new File([], 'share-test.jpg', { type: 'image/jpeg' })])

  /**
   * プレビュー用のObject URLを破棄する。
   *
   * @returns なし。
   */
  const revokePreviewUrl = (): void => {
    const objectUrl = previewUrl()
    if (objectUrl) URL.revokeObjectURL(objectUrl)

    setPreviewUrl(undefined)
    setPreviewBlob(undefined)
  }

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
   * ダイアログの開閉状態を更新し、閉じるときは一時画像とエラーを破棄する。
   *
   * @param nextOpen - 次のダイアログ開閉状態。
   * @returns なし。
   */
  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen && isImageActionRunning()) return

    if (nextOpen) {
      captureRevision += 1
      readyJacketKeys.clear()
      setReadyJacketCount(0)
      revokePreviewUrl()
      setImageActionError(undefined)
    } else {
      captureRevision += 1
      revokePreviewUrl()
      setImageSheet(undefined)
      setImageActionError(undefined)
    }
    setOpen(nextOpen)
  }

  /**
   * 画面外の画像化対象をJPEGへ変換し、プレビュー表示と共有操作で同一の画像にする。
   *
   * @returns プレビュー生成処理の完了時に解決されるPromise。
   */
  const capturePreviewImage = async (): Promise<void> => {
    const sheet = imageSheet()
    if (!sheet || !open() || !isPreviewReady()) return

    const revision = ++captureRevision
    setIsCapturingPreview(true)
    setImageActionError(undefined)

    try {
      const blob = await captureElementAsImage(sheet, {
        format: 'jpeg',
        pixelRatio: RATING_IMAGE_PIXEL_RATIO,
        quality: RATING_IMAGE_JPEG_QUALITY,
      })
      if (revision !== captureRevision || !open()) return

      const oldUrl = previewUrl()
      if (oldUrl) URL.revokeObjectURL(oldUrl)

      const objectUrl = URL.createObjectURL(blob)
      if (revision !== captureRevision || !open()) {
        URL.revokeObjectURL(objectUrl)
        return
      }
      setPreviewBlob(blob)
      setPreviewUrl(objectUrl)
    } catch {
      if (revision !== captureRevision) return

      setImageActionError(RATING_IMAGE_COPY.previewError)
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
    if (open() && !isCapturingPreview() && !previewUrl()) {
      void capturePreviewImage()
    }
  }

  /**
   * プレビュー表示中の画像をファイル名付きのJPEGファイルとして返す。
   *
   * @returns ファイル名を設定したJPEGファイル。
   */
  const createRatingImageFile = (): File => {
    const blob = previewBlob()
    if (!blob) throw new Error('Rating preview image is not ready')

    return new File([blob], formatRatingImageFilename(props.username), { type: 'image/jpeg' })
  }

  /**
   * プレビュー表示中の画像をWeb Share APIで共有する。
   *
   * プレビュー時点で画像が確定しているため、クリック操作内でファイルを組み立てる。
   *
   * @returns 共有処理の完了時に解決されるPromise。
   */
  const shareRatingImage = async (): Promise<void> => {
    if (isImageActionRunning() || !previewUrl()) return

    let imageFile: File
    try {
      imageFile = createRatingImageFile()
    } catch {
      setImageActionError(RATING_IMAGE_COPY.shareError)
      return
    }
    if (!canShareFiles([imageFile])) {
      setImageActionError(RATING_IMAGE_COPY.shareError)
      return
    }

    setIsSharing(true)
    setImageActionError(undefined)

    try {
      await navigator.share({
        files: [imageFile],
        text: SOCIAL_SHARE_TEXT,
        title: RATING_IMAGE_COPY.dialogTitle,
      })
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setImageActionError(RATING_IMAGE_COPY.shareError)
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

  // 画像内容の変更時はプレビューを破棄し、ジャケット準備完了後に再生成する。
  createEffect(
    on(
      () => [props.rating, props.playerInfo, props.honors, props.showJackets],
      () => {
        if (!open()) return

        captureRevision += 1
        readyJacketKeys.clear()
        setReadyJacketCount(0)
        revokePreviewUrl()
        setImageActionError(undefined)
      },
      { defer: true }
    )
  )

  // 画面外の画像化対象の準備が整い次第、表示用の実画像を生成する。
  createEffect(() => {
    if (!open()) return
    if (!isPreviewReady()) return

    const sheet = imageSheet()
    if (!sheet || previewUrl() || isCapturingPreview()) return

    untrack(() => void capturePreviewImage())
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
                disabled={isImageActionRunning()}
              >
                <X class="h-5 w-5" aria-hidden="true" />
              </Dialog.CloseButton>
            </div>

            <div class="mt-4 min-h-0 flex-1 basis-0 overflow-hidden rounded-md bg-bg p-3">
              <div
                class="scrollbar-none h-full w-full overflow-y-auto overscroll-contain"
                aria-busy={!previewUrl()}
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
                              {RATING_IMAGE_COPY.retryPreview}
                            </AppButton>
                          </div>
                        }
                      >
                        <Loading ariaLabel={RATING_IMAGE_COPY.preparingPreview} />
                      </Show>
                    </div>
                  }
                >
                  {(objectUrl) => (
                    <img
                      src={objectUrl()}
                      alt={RATING_IMAGE_COPY.previewAlt}
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
              <div class="flex flex-wrap justify-end gap-2">
                <AppButton
                  variant="primary"
                  size="sm"
                  disabled={!canShareRatingImage() || isImageActionRunning() || !previewUrl()}
                  aria-busy={isSharing()}
                  onClick={() => void shareRatingImage()}
                  leftIcon={
                    <span class="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                      <Show when={!isSharing()} fallback={<Loading size="inline" ariaHidden />}>
                        <Share2 class="h-5 w-5" aria-hidden="true" />
                      </Show>
                    </span>
                  }
                >
                  {RATING_IMAGE_COPY.share}
                </AppButton>
              </div>
            </div>

            <div class="pointer-events-none fixed left-[-100000px] top-0" aria-hidden="true">
              <RatingImageSheet
                captureRef={(element) => setImageSheet(element)}
                playerInfo={props.playerInfo}
                honors={props.honors}
                rating={props.rating}
                showJackets={props.showJackets}
                onJacketReadyChange={handleJacketReadyChange}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Show>
    </Dialog>
  )
}

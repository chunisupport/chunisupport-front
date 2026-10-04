import { Collapsible } from '@kobalte/core/collapsible'
import { ImageDown, Share2 } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createResource, createSignal, on, Show } from 'solid-js'
import { fetchPossessions } from '../../../../api/possessions'
import { Loading } from '../../../../components'
import { AppButton, getAppButtonClass } from '../../../../components/common/AppButton'
import { AppDisclosureTrigger } from '../../../../components/common/AppDisclosureTrigger'
import { AppSelect } from '../../../../components/common/AppSelect'
import { CheckboxField } from '../../../../components/common/CheckboxField'
import { ImagePreviewDialog } from '../../../../components/common/ImagePreviewDialog'
import { DEFAULT_POSSESSION_NAME } from '../../../../constants/possession'
import { RATING_SLOT_COUNT } from '../../../../constants/rating'
import { createImagePreview } from '../../../../hooks/createImagePreview'
import type { HonorDTO, PlayerDTO, UserRatingDTO } from '../../../../types/api'
import { canShareFiles, captureElementAsImage } from '../../../../utils/domImageCapture'
import { buildChunithmJacketUrl } from '../../../../utils/jacket'
import { resolvePossessionName } from '../../../../utils/possession'
import {
  RATING_IMAGE_COPY,
  RATING_IMAGE_DEFAULT_VERSION_OPTION,
  RATING_IMAGE_JPEG_QUALITY,
  RATING_IMAGE_PIXEL_RATIO,
  RATING_IMAGE_V2_NEW_BADGE_CLASS,
  RATING_IMAGE_VERSION_OPTIONS,
  type RatingImageVersionOption,
} from '../UserProfileView.constants'
import { RatingImageSheet } from './RatingImageSheet'
import { RatingImageSheetV2 } from './RatingImageSheetV2'
import { formatRatingImageFilename } from './ratingImageFilename'
import {
  readRatingImageV2OptionsOpen,
  saveRatingImageV2OptionsOpen,
} from './ratingImageV2OptionsStorage'

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
 * @param props - プレイヤー情報、称号、レーティング枠、ジャケット表示設定。Ver. 2 は NEW! バッジ、ポゼッション色、レベル非表示を切り替えられる。
 * @returns 画像化プレビューを開くボタンとダイアログ。
 */
export const RatingImagePreviewDialog: Component<Props> = (props) => {
  const [imageSheet, setImageSheet] = createSignal<HTMLDivElement>()
  const [selectedVersionOption, setSelectedVersionOption] = createSignal(
    RATING_IMAGE_DEFAULT_VERSION_OPTION
  )
  const [showLatestUpdateBadge, setShowLatestUpdateBadge] = createSignal(true)
  const [applyPossession, setApplyPossession] = createSignal(true)
  const [hidePlayerLevel, setHidePlayerLevel] = createSignal(false)
  const [hideClassEmblem, setHideClassEmblem] = createSignal(false)
  const [v2OptionsOpen, setV2OptionsOpen] = createSignal(readRatingImageV2OptionsOpen())

  const [readyJacketCount, setReadyJacketCount] = createSignal(0)
  const readyJacketKeys = new Set<string>()

  /**
   * ジャケット画像の準備状態を初期化する。
   *
   * @returns なし。
   */
  const resetJacketReadiness = (): void => {
    readyJacketKeys.clear()
    setReadyJacketCount(0)
  }

  /**
   * 画像をファイル名付きのJPEGファイルとして返す。ファイル名には呼び出し時点の日時を使う。
   *
   * @param blob - JPEG画像。
   * @returns ファイル名を設定したJPEGファイル。
   */
  const createRatingImageFile = (blob: Blob): File =>
    new File(
      [blob],
      formatRatingImageFilename(props.username, new Date(), selectedVersionOption().value),
      { type: 'image/jpeg' }
    )

  const preview = createImagePreview({
    capture: () => {
      const sheet = imageSheet()
      if (!sheet) return Promise.reject(new Error('Rating image sheet is not ready'))

      return captureElementAsImage(sheet, {
        format: 'jpeg',
        pixelRatio: RATING_IMAGE_PIXEL_RATIO,
        quality: RATING_IMAGE_JPEG_QUALITY,
      })
    },
    // 共有時は共有時点の日時でファイル名を付け直すため、ここでのファイル名はプレビュー用。
    toFiles: (blob) => [createRatingImageFile(blob)],
    canCapture: () => imageSheet() !== undefined && isPreviewReady(),
    onOpenChange: (nextOpen) => {
      if (nextOpen) {
        resetJacketReadiness()
      } else {
        setImageSheet(undefined)
      }
    },
    captureErrorMessage: RATING_IMAGE_COPY.previewError,
    shareErrorMessage: RATING_IMAGE_COPY.shareError,
    shareTitle: RATING_IMAGE_COPY.dialogTitle,
  })

  const [possessions] = createResource(
    () => (preview.open() && selectedVersionOption().value === 'v2' ? true : undefined),
    fetchPossessions
  )
  /** レーティング枠画像 Ver. 2 のヘッダーへ渡すポゼッション名 */
  const possessionName = createMemo(() => {
    if (!applyPossession()) return DEFAULT_POSSESSION_NAME

    return resolvePossessionName(props.playerInfo.possession_id, possessions() ?? [])
  })

  /**
   * 画像化対象に含まれる、読み込み完了を待つ画像の件数を返す。
   *
   * @returns ジャケットまたはプレースホルダーの件数。
   */
  const expectedJacketCount = (): number => {
    const filledRecords = [
      ...props.rating.best.slice(0, RATING_SLOT_COUNT.best),
      ...props.rating.new.slice(0, RATING_SLOT_COUNT.new),
    ]

    if (selectedVersionOption().value === 'v2') return filledRecords.length
    if (!props.showJackets) return 0

    return filledRecords.filter((record) => buildChunithmJacketUrl(record.img) !== null).length
  }

  /**
   * ポゼッションマスタの取得が終わり、ヘッダー色を確定できるかを返す。
   *
   * @returns Ver. 1、ポゼッション非反映、またはマスタ取得完了・失敗時は true。
   */
  const isPossessionReady = (): boolean => {
    if (selectedVersionOption().value !== 'v2' || !applyPossession()) return true

    return possessions.state === 'ready' || possessions.state === 'errored'
  }

  /**
   * ジャケットとポゼッション色の準備が終わり、画像化を開始できるかを返す。
   *
   * @returns 画像化を開始可能な場合はtrue。
   */
  const isPreviewReady = (): boolean =>
    readyJacketCount() >= expectedJacketCount() && isPossessionReady()

  /**
   * 現在のブラウザがJPEGファイルの共有に対応しているかを返す。
   *
   * @returns Web Share APIでJPEGファイルを共有できる場合はtrue。
   */
  const canShareRatingImage = (): boolean =>
    canShareFiles([new File([], 'share-test.jpg', { type: 'image/jpeg' })])

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
   * プレビュー画像を破棄し、準備完了後に再生成できるようにする。
   *
   * ジャケット準備状態を先に初期化し、破棄直後に古い準備状態で再生成されないようにする。
   *
   * @param resetJackets - ジャケット準備状態も初期化する場合は true。
   * @returns なし。
   */
  const invalidatePreview = (resetJackets: boolean): void => {
    if (resetJackets) resetJacketReadiness()
    preview.reset()
  }

  /**
   * デザインバージョンを切り替え、プレビューを作り直す。
   *
   * @param option - 次に使うデザインバージョン。空選択は無視する。
   * @returns なし。
   */
  const handleVersionChange = (option: RatingImageVersionOption | null): void => {
    if (!option || option.value === selectedVersionOption().value) return

    invalidatePreview(true)
    setSelectedVersionOption(option)
  }

  /**
   * NEW! バッジの表示を切り替え、プレビューを作り直す。
   *
   * @param checked - 最新更新バッジを表示する場合は true。
   * @returns なし。
   */
  const handleShowLatestUpdateBadgeChange = (checked: boolean): void => {
    setShowLatestUpdateBadge(checked)
    invalidatePreview(false)
  }

  /**
   * ポゼッション色の反映を切り替え、プレビューを作り直す。
   *
   * @param checked - ヘッダーへポゼッション色を反映する場合は true。
   * @returns なし。
   */
  const handleApplyPossessionChange = (checked: boolean): void => {
    setApplyPossession(checked)
    invalidatePreview(false)
  }

  /**
   * プレイヤーレベルの非表示を切り替え、プレビューを作り直す。
   *
   * @param checked - レベルを隠す場合は true。
   * @returns なし。
   */
  const handleHidePlayerLevelChange = (checked: boolean): void => {
    setHidePlayerLevel(checked)
    invalidatePreview(false)
  }

  /**
   * エンブレムの非表示を切り替え、プレビューを作り直す。
   *
   * @param checked - エンブレムを隠す場合は true。
   * @returns なし。
   */
  const handleHideClassEmblemChange = (checked: boolean): void => {
    setHideClassEmblem(checked)
    invalidatePreview(false)
  }

  /**
   * Ver. 2 の表示設定パネルの開閉を更新し、次回以降も同じ状態になるよう保存する。
   *
   * @param nextOpen - 次の開閉状態。
   * @returns なし。
   */
  const handleV2OptionsOpenChange = (nextOpen: boolean): void => {
    setV2OptionsOpen(nextOpen)
    saveRatingImageV2OptionsOpen(nextOpen)
  }

  /**
   * プレビュー表示中の画像を、共有時点の日時をファイル名に付けてWeb Share APIで共有する。
   *
   * @returns なし。
   */
  const shareRatingImage = (): void => {
    const image = preview.previews()[0]
    if (preview.isBusy() || !image) return

    void preview.share([createRatingImageFile(image.file)])
  }

  // 画像内容の変更時はプレビューを破棄し、ジャケット準備完了後に再生成する。
  createEffect(
    on(
      () => [props.rating, props.playerInfo, props.honors, props.showJackets],
      () => {
        if (!preview.open()) return

        invalidatePreview(true)
      },
      { defer: true }
    )
  )

  return (
    <ImagePreviewDialog
      open={preview.open()}
      onOpenChange={preview.handleOpenChange}
      triggerClass={getAppButtonClass({
        variant: 'surface',
        shape: 'pill',
        class: 'h-10 focus-visible:ring-offset-2',
      })}
      triggerIcon={<ImageDown class="h-5 w-5" aria-hidden="true" />}
      triggerLabel={RATING_IMAGE_COPY.openPreview}
      title={RATING_IMAGE_COPY.dialogTitle}
      description={RATING_IMAGE_COPY.dialogDescription}
      closeLabel={RATING_IMAGE_COPY.close}
      closeDisabled={preview.isCloseLocked()}
      controls={
        <>
          <div class="mt-3 w-36 shrink-0">
            <AppSelect<RatingImageVersionOption>
              options={RATING_IMAGE_VERSION_OPTIONS}
              optionValue="value"
              optionTextValue="label"
              value={selectedVersionOption()}
              onChange={handleVersionChange}
              label={RATING_IMAGE_COPY.versionLabel}
              labelVariant="srOnly"
              formatLabel={(option) => option.label}
              triggerClass="h-10"
              itemClass="hover:bg-success-bg data-[highlighted]:bg-success-bg data-[selected]:bg-success-bg"
              contentZIndexClass="z-70"
              disabled={preview.isSharing()}
            />
          </div>

          <Show when={selectedVersionOption().value === 'v2'}>
            <Collapsible
              class="mt-3 w-full shrink-0 rounded-lg border border-border-strong bg-surface"
              open={v2OptionsOpen()}
              onOpenChange={handleV2OptionsOpenChange}
              disabled={preview.isSharing()}
            >
              <AppDisclosureTrigger class="gap-1.5" label={RATING_IMAGE_COPY.v2OptionsLegend} />
              <Collapsible.Content>
                <div class="border-t border-border p-3">
                  <div class="flex flex-col items-start gap-2">
                    <CheckboxField
                      id="rating-image-show-latest-update-badge"
                      checked={showLatestUpdateBadge()}
                      disabled={preview.isSharing()}
                      onChange={handleShowLatestUpdateBadgeChange}
                      label={
                        <span class="inline-flex items-center gap-1.5">
                          <span class={`shrink-0 ${RATING_IMAGE_V2_NEW_BADGE_CLASS}`}>
                            {RATING_IMAGE_COPY.latestUpdateBadge}
                          </span>
                          <span>{RATING_IMAGE_COPY.showLatestUpdateBadgeLabel}</span>
                        </span>
                      }
                    />
                    <CheckboxField
                      id="rating-image-apply-possession"
                      checked={applyPossession()}
                      disabled={preview.isSharing()}
                      onChange={handleApplyPossessionChange}
                      label={RATING_IMAGE_COPY.applyPossessionLabel}
                    />
                    <CheckboxField
                      id="rating-image-hide-player-level"
                      checked={hidePlayerLevel()}
                      disabled={preview.isSharing()}
                      onChange={handleHidePlayerLevelChange}
                      label={RATING_IMAGE_COPY.hidePlayerLevelLabel}
                    />
                    <CheckboxField
                      id="rating-image-hide-class-emblem"
                      checked={hideClassEmblem()}
                      disabled={preview.isSharing()}
                      onChange={handleHideClassEmblemChange}
                      label={RATING_IMAGE_COPY.hideClassEmblemLabel}
                    />
                  </div>
                </div>
              </Collapsible.Content>
            </Collapsible>
          </Show>
        </>
      }
      hasPreview={preview.previews().length > 0}
      previewBusy={preview.previews().length === 0}
      loadingLabel={RATING_IMAGE_COPY.preparingPreview}
      captureError={preview.captureError()}
      retryLabel={RATING_IMAGE_COPY.retryPreview}
      onRetry={preview.retryCapture}
      footerError={preview.shareError()}
      footer={
        <div class="flex flex-wrap justify-end gap-2">
          <AppButton
            variant="primary"
            size="sm"
            disabled={!canShareRatingImage() || preview.isBusy() || preview.previews().length === 0}
            aria-busy={preview.isSharing()}
            onClick={shareRatingImage}
            leftIcon={
              <span class="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                <Show when={!preview.isSharing()} fallback={<Loading size="inline" ariaHidden />}>
                  <Share2 class="h-5 w-5" aria-hidden="true" />
                </Show>
              </span>
            }
          >
            {RATING_IMAGE_COPY.share}
          </AppButton>
        </div>
      }
      captureTarget={
        <div class="pointer-events-none fixed left-[-100000px] top-0" aria-hidden="true">
          <Show
            when={selectedVersionOption().value === 'v2'}
            fallback={
              <RatingImageSheet
                captureRef={(element) => setImageSheet(element)}
                playerInfo={props.playerInfo}
                honors={props.honors}
                rating={props.rating}
                showJackets={props.showJackets}
                onJacketReadyChange={handleJacketReadyChange}
              />
            }
          >
            <RatingImageSheetV2
              captureRef={(element) => setImageSheet(element)}
              playerInfo={props.playerInfo}
              honors={props.honors}
              rating={props.rating}
              showJackets={props.showJackets}
              showLatestUpdateBadge={showLatestUpdateBadge()}
              hidePlayerLevel={hidePlayerLevel()}
              hideClassEmblem={hideClassEmblem()}
              possessionName={possessionName()}
              onJacketReadyChange={handleJacketReadyChange}
            />
          </Show>
        </div>
      }
    >
      <Show when={preview.previews()[0]}>
        {(image) => (
          <img
            src={image().url}
            alt={RATING_IMAGE_COPY.previewAlt}
            class="h-auto w-full max-w-full shadow-sm [-webkit-touch-callout:default]"
          />
        )}
      </Show>
    </ImagePreviewDialog>
  )
}

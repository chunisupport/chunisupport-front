import { Slider } from '@kobalte/core/slider'
import { ImageDown } from 'lucide-solid'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  on,
  onCleanup,
  Show,
} from 'solid-js'
import { fetchAdminUsers, fetchUserProfileSummary, fetchUserRating } from '../../api/users'
import { Loading } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import { AppSelect } from '../../components/common/AppSelect'
import { CheckboxField } from '../../components/common/CheckboxField'
import { SearchTextField } from '../../components/common/SearchTextField'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { PlayerDTO, UserRatingDTO } from '../../types/api'
import { isForbiddenApiError, isNotFoundApiError } from '../../utils/apiError'
import { captureElementAsImage, downloadBlobFile } from '../../utils/domImageCapture'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { RatingImageSheet } from '../users/UserPage/components/RatingImageSheet'
import { RatingImageSheetV2 } from '../users/UserPage/components/RatingImageSheetV2'
import { formatRatingImageFilename } from '../users/UserPage/components/ratingImageFilename'
import {
  RATING_IMAGE_JPEG_QUALITY,
  RATING_IMAGE_PIXEL_RATIO,
  RATING_IMAGE_VERSION_OPTIONS,
  type RatingImageVersionOption,
} from '../users/UserPage/UserProfileView.constants'
import { ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY } from './AdminRatingImageDomPreviewPage.constants'
import {
  countRatingImagePreviewJackets,
  previewScalePercentToFactor,
  RATING_IMAGE_DOM_PREVIEW_SAMPLE,
  RATING_IMAGE_DOM_PREVIEW_SCALE_PERCENT,
  type RatingImageDomPreviewModel,
  resolveExactAdminUsername,
} from './adminRatingImageDomPreview'

type UserPreviewResult =
  | { type: 'ready'; player: PlayerDTO; rating: UserRatingDTO; username: string }
  | { type: 'noPlayer' }
  | { type: 'private' }
  | { type: 'notFound' }
  | { type: 'multiple' }

/**
 * 公開プロフィールとレーティング枠を取得する。
 *
 * @param username - 公開ユーザー名。
 * @returns 確認用データ。プレイヤー未登録の場合はその旨。
 */
const loadPublicPreview = async (username: string): Promise<UserPreviewResult> => {
  const [profile, rating] = await Promise.all([
    fetchUserProfileSummary(username),
    fetchUserRating(username),
  ])
  if (!profile.player) return { type: 'noPlayer' }

  return { type: 'ready', player: profile.player, rating, username }
}

/**
 * ユーザー名またはプレイヤー名から画像化前DOM確認用データを取得する。
 *
 * 非公開プレイヤーは管理者でも公開APIから取得できない。
 *
 * @param query - ユーザー名またはプレイヤー名。
 * @returns 確認用データ、または非公開・未検出などの結果。
 */
const fetchUserPreview = async (query: string): Promise<UserPreviewResult> => {
  try {
    return await loadPublicPreview(query)
  } catch (error) {
    if (isForbiddenApiError(error)) return { type: 'private' }
    if (!isNotFoundApiError(error)) throw error
  }

  const users = await fetchAdminUsers({ name: query, page: 1 })
  const resolved = resolveExactAdminUsername(users, query)
  if (resolved === 'none') return { type: 'notFound' }
  if (resolved === 'multiple') return { type: 'multiple' }

  try {
    return await loadPublicPreview(resolved)
  } catch (error) {
    if (isForbiddenApiError(error)) return { type: 'private' }
    if (isNotFoundApiError(error)) return { type: 'notFound' }
    throw error
  }
}

/**
 * 管理者向けにベスト枠・新曲枠の画像化前DOMを画面上へ表示する。
 *
 * サンプル表示を初期値とし、ユーザー名またはプレイヤー名で公開データを切り替える。
 * 表示サイズを変更して俯瞰し、同じDOMをJPEGへ画像化できる。
 *
 * @returns 画像化前DOM確認画面。
 */
const AdminRatingImageDomPreviewPage = () => {
  useDocumentTitle(ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.pageTitle)

  const [usernameInput, setUsernameInput] = createSignal('')
  const [requestedQuery, setRequestedQuery] = createSignal<string | undefined>()
  const [selectedVersionOption, setSelectedVersionOption] = createSignal(
    RATING_IMAGE_VERSION_OPTIONS[0]
  )
  const [showJackets, setShowJackets] = createSignal(true)
  const [scalePercent, setScalePercent] = createSignal<number>(
    RATING_IMAGE_DOM_PREVIEW_SCALE_PERCENT.defaultValue
  )
  const [sheetEl, setSheetEl] = createSignal<HTMLDivElement>()
  const [sheetSize, setSheetSize] = createSignal({ width: 0, height: 0 })
  const [isCapturing, setIsCapturing] = createSignal(false)
  const [captureError, setCaptureError] = createSignal<string>()
  const [readyJacketCount, setReadyJacketCount] = createSignal(0)
  const readyJacketKeys = new Set<string>()
  let captureRevision = 0

  const [userPreview] = createResource(requestedQuery, fetchUserPreview)

  /**
   * 検索語を確定し、空欄ならサンプル表示へ戻す。
   *
   * @param event - 検索フォームの submit イベント。
   * @returns なし。
   */
  const handleSearchSubmit = (event: SubmitEvent): void => {
    event.preventDefault()
    const query = usernameInput().trim()
    setRequestedQuery(query === '' ? undefined : query)
  }

  /**
   * デザインバージョンを切り替える。
   *
   * @param option - 次に使うデザインバージョン。空選択は無視する。
   * @returns なし。
   */
  const handleVersionChange = (option: RatingImageVersionOption | null): void => {
    if (!option || option.value === selectedVersionOption().value) return
    setSelectedVersionOption(option)
  }

  /**
   * 表示サイズスライダーの値を反映する。
   *
   * @param values - Kobalte Slider が返すパーセント値。
   * @returns なし。
   */
  const handleScaleChange = (values: number[]): void => {
    const next = values[0]
    if (next === undefined) return
    setScalePercent(next)
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

  const loadErrorMessage = createMemo(() => {
    const error = userPreview.error
    if (requestedQuery() && error) return toUserFriendlyErrorMessage(error)

    const result = userPreview()
    if (!requestedQuery() || !result) return undefined
    if (result.type === 'notFound') return ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.userNotFound
    if (result.type === 'noPlayer') return ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.noPlayerData
    if (result.type === 'private') return ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.privatePlayer
    if (result.type === 'multiple') return ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.multipleMatches

    return undefined
  })

  const previewModel = createMemo((): RatingImageDomPreviewModel | undefined => {
    const query = requestedQuery()
    if (!query) return RATING_IMAGE_DOM_PREVIEW_SAMPLE
    if (userPreview.loading) return undefined

    const result = userPreview()
    if (result?.type !== 'ready') return RATING_IMAGE_DOM_PREVIEW_SAMPLE

    return {
      username: result.username,
      player: result.player,
      honors: result.player.honors,
      rating: result.rating,
    }
  })

  const scale = createMemo(() => previewScalePercentToFactor(scalePercent()))

  const expectedJacketCount = createMemo(() => {
    const model = previewModel()
    if (!model) return 0

    return countRatingImagePreviewJackets(
      model.rating,
      selectedVersionOption().value,
      showJackets()
    )
  })

  const isCaptureReady = createMemo(
    () => Boolean(previewModel()) && readyJacketCount() >= expectedJacketCount()
  )

  createEffect(
    on(
      () => [previewModel(), selectedVersionOption().value, showJackets()],
      () => {
        readyJacketKeys.clear()
        setReadyJacketCount(0)
        setCaptureError(undefined)
      }
    )
  )

  createEffect(() => {
    const sheet = sheetEl()
    if (!sheet) {
      setSheetSize((current) =>
        current.width === 0 && current.height === 0 ? current : { width: 0, height: 0 }
      )
      return
    }

    /**
     * 画像化対象の論理サイズを計測する。
     *
     * @returns なし。
     */
    const updateSize = (): void => {
      const width = sheet.offsetWidth
      const height = sheet.offsetHeight
      setSheetSize((current) =>
        current.width === width && current.height === height ? current : { width, height }
      )
    }

    const observer = new ResizeObserver(updateSize)
    observer.observe(sheet)
    updateSize()
    onCleanup(() => observer.disconnect())
  })

  /**
   * 表示中の画像化前DOMをJPEGとして保存する。
   *
   * @returns 画像化処理の完了時に解決されるPromise。
   */
  const capturePreviewImage = async (): Promise<void> => {
    const sheet = sheetEl()
    const model = previewModel()
    if (!sheet || !model || !isCaptureReady() || isCapturing()) return

    const revision = ++captureRevision
    setIsCapturing(true)
    setCaptureError(undefined)

    try {
      const blob = await captureElementAsImage(sheet, {
        format: 'jpeg',
        pixelRatio: RATING_IMAGE_PIXEL_RATIO,
        quality: RATING_IMAGE_JPEG_QUALITY,
      })
      if (revision !== captureRevision) return

      downloadBlobFile(
        blob,
        formatRatingImageFilename(model.username, new Date(), selectedVersionOption().value)
      )
    } catch {
      if (revision !== captureRevision) return
      setCaptureError(ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.captureError)
    } finally {
      if (revision === captureRevision) setIsCapturing(false)
    }
  }

  return (
    <main class="flex w-full flex-col gap-4 p-4">
      <h1 class="text-2xl font-semibold">{ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.heading}</h1>

      <div class="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-bg py-3">
        <form class="flex min-w-0 flex-wrap items-end gap-2" onSubmit={handleSearchSubmit}>
          <SearchTextField
            class="min-w-48 flex-1"
            label={ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.usernameLabel}
            ariaLabel={ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.usernameAriaLabel}
            value={usernameInput()}
            placeholder={ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.usernamePlaceholder}
            onChange={setUsernameInput}
          />
          <AppButton type="submit" variant="primary">
            {ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.loadButton}
          </AppButton>
        </form>
        <Show when={loadErrorMessage()}>
          {(message) => (
            <p class="text-sm text-danger" role="alert">
              {message()}
            </p>
          )}
        </Show>
        <div class="flex flex-wrap items-end gap-4">
          <div class="w-36">
            <AppSelect<RatingImageVersionOption>
              options={RATING_IMAGE_VERSION_OPTIONS}
              optionValue="value"
              optionTextValue="label"
              value={selectedVersionOption()}
              onChange={handleVersionChange}
              label={ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.versionLabel}
              formatLabel={(option) => option.label}
              triggerClass="h-10"
              itemClass="hover:bg-success-bg data-[highlighted]:bg-success-bg data-[selected]:bg-success-bg"
            />
          </div>
          <CheckboxField
            checked={showJackets()}
            label={ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.showJacketsLabel}
            onChange={setShowJackets}
          />
          <Slider
            class="flex w-56 min-w-48 flex-col gap-1"
            minValue={RATING_IMAGE_DOM_PREVIEW_SCALE_PERCENT.min}
            maxValue={RATING_IMAGE_DOM_PREVIEW_SCALE_PERCENT.max}
            step={RATING_IMAGE_DOM_PREVIEW_SCALE_PERCENT.step}
            value={[scalePercent()]}
            onChange={handleScaleChange}
            getValueLabel={(params) => `${params.values[0]}%`}
          >
            <div class="flex items-center justify-between text-sm text-text-muted">
              <Slider.Label>{ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.scaleLabel}</Slider.Label>
              <Slider.ValueLabel class="font-jost tabular-nums" />
            </div>
            <Slider.Track class="relative h-2 w-full rounded-full bg-surface-muted">
              <Slider.Fill class="absolute h-full rounded-full bg-action-primary" />
              <Slider.Thumb class="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">
                <Slider.Input />
              </Slider.Thumb>
            </Slider.Track>
          </Slider>
          <div class="flex flex-col items-start gap-1">
            <AppButton
              variant="primary"
              disabled={!isCaptureReady() || isCapturing()}
              aria-busy={isCapturing()}
              onClick={() => void capturePreviewImage()}
              leftIcon={
                <span class="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                  <Show when={!isCapturing()} fallback={<Loading size="inline" ariaHidden />}>
                    <ImageDown class="h-5 w-5" aria-hidden="true" />
                  </Show>
                </span>
              }
            >
              {isCapturing()
                ? ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.capturingLabel
                : ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.captureButton}
            </AppButton>
            <Show when={captureError()}>
              {(message) => (
                <p class="text-sm text-danger" role="alert">
                  {message()}
                </p>
              )}
            </Show>
          </div>
        </div>
      </div>

      <Show
        when={!requestedQuery() || !userPreview.loading}
        fallback={
          <div class="h-40">
            <Loading ariaLabel={ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.loadingLabel} />
          </div>
        }
      >
        <Show when={previewModel()} keyed>
          {(model) => (
            <section aria-label={ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY.previewLabel}>
              <div class="overflow-x-auto">
                <div
                  class="overflow-hidden"
                  style={{
                    height: `${sheetSize().height * scale()}px`,
                    width: `${sheetSize().width * scale()}px`,
                  }}
                >
                  <div class="origin-top-left" style={{ transform: `scale(${scale()})` }}>
                    <Show
                      when={selectedVersionOption().value === 'v2'}
                      fallback={
                        <RatingImageSheet
                          captureRef={(element) => setSheetEl(element)}
                          playerInfo={model.player}
                          honors={model.honors}
                          rating={model.rating}
                          showJackets={showJackets()}
                          onJacketReadyChange={handleJacketReadyChange}
                        />
                      }
                    >
                      <RatingImageSheetV2
                        captureRef={(element) => setSheetEl(element)}
                        playerInfo={model.player}
                        honors={model.honors}
                        rating={model.rating}
                        showJackets={showJackets()}
                        onJacketReadyChange={handleJacketReadyChange}
                      />
                    </Show>
                  </div>
                </div>
              </div>
            </section>
          )}
        </Show>
      </Show>
    </main>
  )
}

export default AdminRatingImageDomPreviewPage

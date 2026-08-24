import { Toast, toaster } from '@kobalte/core/toast'
import { CheckCircle, CircleAlert, Info, X } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { Portal } from 'solid-js/web'

type AppToastTone = 'success' | 'error' | 'info'

type AppToastOptions = {
  /** トーストの見た目と読み上げ優先度を決める種別 */
  tone: AppToastTone
  /** トースト本文として表示する文言 */
  message: string
}

const APP_TOAST_DURATION_MS = 3000
const APP_TOAST_REGION_LABEL = '通知'
const APP_TOAST_CLOSE_LABEL = '通知を閉じる'

const APP_TOAST_TONE_CLASS: Record<AppToastTone, string> = {
  success: 'border-success-border bg-surface-raised text-success',
  error: 'border-danger-border bg-surface-raised text-danger',
  info: 'border-border bg-surface-raised text-text',
}

/**
 * トースト種別に対応するアイコンを返す。
 *
 * @param tone - 表示するトーストの種別。
 * @returns 種別に対応するアイコン。
 */
const getAppToastIcon = (tone: AppToastTone): JSX.Element => {
  switch (tone) {
    case 'success':
      return <CheckCircle class="h-5 w-5" aria-hidden="true" />
    case 'error':
      return <CircleAlert class="h-5 w-5" aria-hidden="true" />
    case 'info':
      return <Info class="h-5 w-5" aria-hidden="true" />
  }
}

/**
 * アプリ共通のトースト領域を描画する。
 *
 * @returns Kobalte Toast の表示領域。
 */
export const AppToastRegion = (): JSX.Element => (
  <Portal>
    <Toast.Region
      aria-label={APP_TOAST_REGION_LABEL}
      duration={APP_TOAST_DURATION_MS}
      limit={4}
      pauseOnInteraction
      pauseOnPageIdle
      swipeDirection="right"
      topLayer
      class="fixed right-4 top-4 z-100 w-[min(24rem,calc(100vw-2rem))] outline-none"
    >
      <Toast.List class="flex flex-col gap-3 outline-none" />
    </Toast.Region>
  </Portal>
)

/**
 * アプリ共通のトーストを表示する。
 *
 * @param options - 表示するトーストの種別と文言。
 * @returns 作成されたトーストID。
 */
export const showAppToast = (options: AppToastOptions): number =>
  toaster.show((props) => (
    <Toast
      toastId={props.toastId}
      priority={options.tone === 'error' ? 'high' : 'low'}
      class={`overflow-hidden rounded-md border shadow-lg ${APP_TOAST_TONE_CLASS[options.tone]}`}
    >
      <div class="flex items-start gap-3 px-4 py-3">
        <span class="mt-0.5 shrink-0">{getAppToastIcon(options.tone)}</span>
        <Toast.Description class="min-w-0 flex-1 break-words text-sm leading-5">
          {options.message}
        </Toast.Description>
        <Toast.CloseButton
          aria-label={APP_TOAST_CLOSE_LABEL}
          class="shrink-0 rounded p-1 hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </Toast.CloseButton>
      </div>
      <Toast.ProgressTrack class="h-1 bg-surface-muted">
        <Toast.ProgressFill class="h-full w-[var(--kb-toast-progress-fill-width)] bg-current" />
      </Toast.ProgressTrack>
    </Toast>
  ))

/**
 * 成功トーストを表示する。
 *
 * @param message - 表示する成功文言。
 * @returns 作成されたトーストID。
 */
export const showSuccessToast = (message: string): number =>
  showAppToast({ tone: 'success', message })

/**
 * エラートーストを表示する。
 *
 * @param message - 表示するエラー文言。
 * @returns 作成されたトーストID。
 */
export const showErrorToast = (message: string): number => showAppToast({ tone: 'error', message })

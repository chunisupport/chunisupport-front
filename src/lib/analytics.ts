import { app } from './firebase'

/** アイドル待ちが続いた場合でも Analytics を初期化するまでの最大待機時間（ミリ秒） */
const ANALYTICS_IDLE_TIMEOUT_MS = 3000

/**
 * Firebase Analytics を動的 import して初期化する。
 * 初期化時にページビューが送信される。
 *
 * @returns 初期化完了後に解決される Promise。
 */
const initializeAnalytics = async (): Promise<void> => {
  const { getAnalytics } = await import('firebase/analytics')
  getAnalytics(app)
}

/**
 * 初回描画を妨げないよう、ブラウザのアイドル時に Firebase Analytics を初期化する。
 * `requestIdleCallback` 未対応のブラウザ（Safari）では次のタスクで初期化する。
 *
 * @returns なし。
 */
export const scheduleAnalyticsInitialization = (): void => {
  const run = () => {
    // Analytics の読込失敗（オフライン・デプロイ直後のチャンク欠落など）は画面に影響させない
    void initializeAnalytics().catch(() => undefined)
  }
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: ANALYTICS_IDLE_TIMEOUT_MS })
    return
  }
  setTimeout(run)
}

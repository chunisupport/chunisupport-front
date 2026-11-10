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
 * ブラウザのアイドル時に Firebase Analytics を初期化する。
 *
 * @returns なし。
 */
const scheduleOnIdle = (): void => {
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

/**
 * 初回描画とページデータの取得を妨げないよう、load イベント後のアイドル時に Firebase Analytics を初期化する。
 * load 前に読み込みを始めると、Analytics と gtag.js の取得完了まで load イベントが遅れるため待機する。
 * `requestIdleCallback` 未対応のブラウザ（Safari）では load 直後のタスクで初期化する。
 *
 * @returns なし。
 */
export const scheduleAnalyticsInitialization = (): void => {
  window.addEventListener('load', scheduleOnIdle, { once: true })
}

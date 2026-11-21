/** 公開中フロントエンドのバージョン情報。 */
export type FrontendVersion = {
  /** デプロイされたビルドを識別するID。 */
  buildId: string
}

type FrontendVersionDependencies = {
  /** 現在実行しているフロントエンドのビルドID。 */
  currentBuildId: string
  /** 公開中のバージョン情報を取得する処理。 */
  fetchVersion: () => Promise<FrontendVersion>
  /** セッション値を取得する処理。 */
  getSessionValue: (key: string) => string | null
  /** セッション値を保存する処理。 */
  setSessionValue: (key: string, value: string) => void
  /** 新しいビルドがあることを利用者に知らせる処理。 */
  notifyUpdate: () => void
}

const VERSION_FILE_PATH = '/version.json'
const UPDATE_NOTIFIED_SESSION_KEY = 'frontend-update-notified'
const UPDATE_NOTICE_MESSAGE = '新しいバージョンが公開されています。'
const UPDATE_NOTICE_RELOAD_LABEL = '再読み込み'

/** 同時に発生したAPI失敗を一つのバージョン確認へ集約するPromise。 */
let versionCheckPromise: Promise<void> | undefined

/**
 * 公開中フロントエンドのバージョン情報をキャッシュせず取得する。
 *
 * @returns 公開中のビルドID。
 * @throws 通信失敗、HTTPエラー、レスポンス形式不正の場合。
 */
const fetchPublishedVersion = async (): Promise<FrontendVersion> => {
  const response = await fetch(VERSION_FILE_PATH, { cache: 'no-store' })
  if (!response.ok) throw new Error('フロントエンドのバージョン取得に失敗しました')

  const version = (await response.json()) as Partial<FrontendVersion>
  if (typeof version.buildId !== 'string') {
    throw new Error('フロントエンドのバージョン形式が不正です')
  }
  return { buildId: version.buildId }
}

/**
 * 公開中のビルドが実行中より新しい場合、同一セッションで公開ビルドごとに一度だけ利用者へ知らせる。
 * 自動で再読み込みしないのは、入力中のフォームを消さないため。
 *
 * バージョン確認自体の失敗は既存のAPIエラー表示へフォールバックするため通知しない。
 *
 * @param dependencies - バージョン取得、セッション管理、通知に使う依存関係。
 * @returns バージョン確認が完了したときに解決されるPromise。
 */
export const notifyWhenNewFrontendIsAvailable = async (
  dependencies: FrontendVersionDependencies
): Promise<void> => {
  try {
    const publishedVersion = await dependencies.fetchVersion()
    if (publishedVersion.buildId === dependencies.currentBuildId) return
    if (dependencies.getSessionValue(UPDATE_NOTIFIED_SESSION_KEY) === publishedVersion.buildId)
      return

    dependencies.setSessionValue(UPDATE_NOTIFIED_SESSION_KEY, publishedVersion.buildId)
    dependencies.notifyUpdate()
  } catch {
    // バージョン確認に失敗した場合は、呼び出し元の既存エラー処理を継続する。
  }
}

/**
 * 再読み込みボタン付きの更新通知を表示する。
 * トーストは画面部品のため、テスト環境でも読み込める遅延 import にする。読み込み失敗時は通知しない。
 *
 * @returns なし。
 */
const showUpdateNotice = (): void => {
  void import('../components/common/AppToast')
    .then(({ showAppToast }) =>
      showAppToast({
        tone: 'info',
        message: UPDATE_NOTICE_MESSAGE,
        action: { label: UPDATE_NOTICE_RELOAD_LABEL, onClick: () => window.location.reload() },
      })
    )
    .catch(() => undefined)
}

/**
 * API取得失敗時に、公開中のフロントエンドが更新されているか確認する。
 *
 * @returns バージョン確認が完了したときに解決されるPromise。
 */
export const checkForFrontendUpdate = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve()
  if (versionCheckPromise) return versionCheckPromise

  versionCheckPromise = notifyWhenNewFrontendIsAvailable({
    currentBuildId: __FRONTEND_BUILD_ID__,
    fetchVersion: fetchPublishedVersion,
    getSessionValue: (key) => window.sessionStorage.getItem(key),
    setSessionValue: (key, value) => window.sessionStorage.setItem(key, value),
    notifyUpdate: showUpdateNotice,
  }).finally(() => {
    versionCheckPromise = undefined
  })
  return versionCheckPromise
}

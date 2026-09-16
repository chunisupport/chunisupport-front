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
  /** ページを再読み込みする処理。 */
  reload: () => void
}

const VERSION_FILE_PATH = '/version.json'
const AUTO_RELOAD_SESSION_KEY = 'frontend-update-auto-reloaded'

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
 * 公開中のビルドが実行中より新しい場合、同一セッションで一度だけページを再読み込みする。
 *
 * バージョン確認自体の失敗は既存のAPIエラー表示へフォールバックするため通知しない。
 *
 * @param dependencies - バージョン取得、セッション管理、再読み込みに使う依存関係。
 * @returns バージョン確認が完了したときに解決されるPromise。
 */
export const reloadWhenNewFrontendIsAvailable = async (
  dependencies: FrontendVersionDependencies
): Promise<void> => {
  try {
    if (dependencies.getSessionValue(AUTO_RELOAD_SESSION_KEY)) return

    const publishedVersion = await dependencies.fetchVersion()
    if (publishedVersion.buildId === dependencies.currentBuildId) return

    dependencies.setSessionValue(AUTO_RELOAD_SESSION_KEY, dependencies.currentBuildId)
    dependencies.reload()
  } catch {
    // バージョン確認に失敗した場合は、呼び出し元の既存エラー処理を継続する。
  }
}

/**
 * API取得失敗時に、公開中のフロントエンドが更新されているか確認する。
 *
 * @returns バージョン確認が完了したときに解決されるPromise。
 */
export const checkForFrontendUpdate = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve()
  if (versionCheckPromise) return versionCheckPromise

  versionCheckPromise = reloadWhenNewFrontendIsAvailable({
    currentBuildId: __FRONTEND_BUILD_ID__,
    fetchVersion: fetchPublishedVersion,
    getSessionValue: (key) => window.sessionStorage.getItem(key),
    setSessionValue: (key, value) => window.sessionStorage.setItem(key, value),
    reload: () => window.location.reload(),
  }).finally(() => {
    versionCheckPromise = undefined
  })
  return versionCheckPromise
}

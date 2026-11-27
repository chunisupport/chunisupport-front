import type { AppAnnouncementDTO } from '../types/api'

/** 閉じたお知らせを保存する localStorage のキー */
export const DISMISSED_APP_ANNOUNCEMENTS_STORAGE_KEY = 'chunisupport-dismissed-app-announcements'

/** 閉じたお知らせの `id:revision` キーの一覧 */
export type DismissedAppAnnouncements = string[]

/** 遷移先の種類 */
export type AppAnnouncementTarget =
  | { type: 'internal'; href: string }
  | { type: 'external'; href: string }

/** お知らせを選択したときの動作 */
export type AppAnnouncementAction = { type: 'message'; body: string } | AppAnnouncementTarget

/** 本文の表示単位 */
export type AppAnnouncementBodySegment =
  | { type: 'text'; text: string }
  | { type: 'link'; text: string; target: AppAnnouncementTarget }

/** アプリ内パス。URLパーサが `/` 扱い・除去する `\` と空白を含むものは別オリジンへ抜けうるため拒否する */
const INTERNAL_PATH_PATTERN = /^\/(?!\/)[^\s\\]*$/

/** 本文中の `[リンクテキスト](URL)` 記法 */
const BODY_LINK_PATTERN = /\[([^\]\n]+)\]\(([^)\s]+)\)/g

/**
 * URL文字列を遷移先として解釈する。
 * `/` 始まり（`//`・`\`・空白を含むものを除く）はアプリ内パス、http(s) は外部URLとし、それ以外は遷移させない。
 *
 * @param url - 遷移先のURL文字列。
 * @returns 遷移先。想定外の値の場合は null。
 */
export const resolveAppAnnouncementTarget = (url: string): AppAnnouncementTarget | null => {
  if (url.startsWith('/'))
    return INTERNAL_PATH_PATTERN.test(url) ? { type: 'internal', href: url } : null
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:' ? { type: 'external', href: url } : null
  } catch {
    return null
  }
}

/**
 * お知らせを選択したときの動作を決める。
 *
 * @param announcement - 対象のお知らせ。
 * @returns 動作。未知の種別や不正な項目の場合は null（表示しない）。
 */
export const resolveAppAnnouncementAction = (
  announcement: AppAnnouncementDTO
): AppAnnouncementAction | null => {
  if (announcement.kind === 'message') {
    return announcement.body === null ? null : { type: 'message', body: announcement.body }
  }
  if (announcement.kind === 'link' && announcement.target_url !== null) {
    return resolveAppAnnouncementTarget(announcement.target_url)
  }
  return null
}

/**
 * 本文をテキストとリンクに分割する。遷移させられないURLの記法はテキストのまま残す。
 *
 * @param body - お知らせの本文。
 * @returns 表示順の本文の単位。
 */
export const parseAppAnnouncementBody = (body: string): AppAnnouncementBodySegment[] => {
  const segments: AppAnnouncementBodySegment[] = []
  let textStart = 0
  for (const match of body.matchAll(BODY_LINK_PATTERN)) {
    const target = resolveAppAnnouncementTarget(match[2])
    if (!target) continue
    if (match.index > textStart) {
      segments.push({ type: 'text', text: body.slice(textStart, match.index) })
    }
    segments.push({ type: 'link', text: match[1], target })
    textStart = match.index + match[0].length
  }
  if (textStart < body.length) segments.push({ type: 'text', text: body.slice(textStart) })
  return segments
}

/**
 * 閉じた状態の記録に使うキーを返す。
 *
 * @param announcement - 対象のお知らせ。
 * @returns `id:revision` 形式のキー。
 */
export const getAppAnnouncementDismissKey = (announcement: AppAnnouncementDTO): string =>
  `${announcement.id}:${announcement.revision}`

/**
 * 配信中のお知らせに対応しない記録を除く。
 * 終了・削除・revision 更新で配信中一覧から消えた記録だけが対象になるため、終了日時の延長では消えない。
 *
 * @param dismissed - 閉じた状態。
 * @param announcements - APIが返した配信中のお知らせ。
 * @returns 配信中のお知らせに対応する記録だけを持つ閉じた状態。
 */
export const pruneDismissedAppAnnouncements = (
  dismissed: DismissedAppAnnouncements,
  announcements: AppAnnouncementDTO[]
): DismissedAppAnnouncements => {
  const activeKeys = new Set(announcements.map(getAppAnnouncementDismissKey))
  return dismissed.filter((key) => activeKeys.has(key))
}

/**
 * localStorage から閉じた状態を読む。
 *
 * @returns 閉じた状態。破損・読み取り不能の場合は空。
 */
export const readDismissedAppAnnouncements = (): DismissedAppAnnouncements => {
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(DISMISSED_APP_ANNOUNCEMENTS_STORAGE_KEY) ?? '[]'
    )
    return Array.isArray(value) ? value.filter((key): key is string => typeof key === 'string') : []
  } catch {
    return []
  }
}

/**
 * 閉じた状態を localStorage へ保存する。
 *
 * @param dismissed - 保存する閉じた状態。
 * @returns なし。
 */
export const saveDismissedAppAnnouncements = (dismissed: DismissedAppAnnouncements): void => {
  try {
    window.localStorage.setItem(DISMISSED_APP_ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(dismissed))
  } catch {
    // 保存できない環境でも、現在の表示からは閉じられるようにする。
  }
}

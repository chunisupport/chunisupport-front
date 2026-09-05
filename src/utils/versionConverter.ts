import type { VersionDTO, VersionSummaryDTO } from '../types/api'

type VersionLike = Pick<VersionDTO, 'name' | 'released_at'> | VersionSummaryDTO

const ORIGINAL_VERSION_NAMES = new Set(['CHUNITHM', 'CHUNITHM PLUS'])

/** CHUNITHMの現行日付判定に使うIANAタイムゾーン */
const CHUNITHM_TIME_ZONE = 'Asia/Tokyo'
/** YYYY-MM-DD形式で日付を得るためのロケール */
const DATE_ONLY_LOCALE = 'sv-SE'
/** CHUNITHM稼働地域の現在日を生成するフォーマッター */
const CHUNITHM_DATE_FORMATTER = new Intl.DateTimeFormat(DATE_ONLY_LOCALE, {
  timeZone: CHUNITHM_TIME_ZONE,
})

/**
 * CHUNITHMの稼働地域を基準にした今日の日付を返す。
 *
 * @returns YYYY-MM-DD形式のJST現在日。
 */
export function getTodayChunithmDate(): string {
  return CHUNITHM_DATE_FORMATTER.format(new Date())
}

/**
 * 稼働開始日が基準日以前のバージョンだけに絞る。
 *
 * 選択肢・初期値の生成用。楽曲リリース日からバージョンを解決する処理は
 * 全件で行い、未来曲が未来名になることで既定フィルターから外れる。
 *
 * @param versions - APIから返されたバージョン一覧。
 * @param referenceDate - 公開済み判定に使うYYYY-MM-DD形式の基準日。既定はJST今日。
 * @returns 基準日以前に稼働開始したバージョン一覧。順序は変えない。
 */
export function filterReleasedVersions<T extends VersionLike>(
  versions: readonly T[],
  referenceDate: string = getTodayChunithmDate()
): T[] {
  return versions.filter((version) => version.released_at.slice(0, 10) <= referenceDate)
}

/**
 * バージョン名の短縮表示を返す。
 *
 * @param versionName - APIから返されたバージョン名。
 * @returns 短縮表示したバージョン名。
 */
export function getShortVersionName(versionName: string): string {
  const normalized = versionName.trim()
  if (ORIGINAL_VERSION_NAMES.has(normalized)) {
    return normalized
  }

  return normalized.replace(/^CHUNITHM\s+/, '')
}

/**
 * リリース日から該当するバージョン名を返す。
 *
 * @param releaseDate - 楽曲のリリース日。
 * @param versions - APIから返されたバージョン一覧。未来分も含めた全件で解決する。
 * @returns 該当するバージョン名。不明な場合は「不明」。
 */
export function resolveVersionNameByReleaseDate(
  releaseDate: string | null,
  versions: readonly VersionLike[]
): string {
  if (!releaseDate) {
    return '不明'
  }

  const normalizedReleaseDate = releaseDate.slice(0, 10)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(normalizedReleaseDate)) {
    return '不明'
  }

  const sorted = [...versions].sort((a, b) => a.released_at.localeCompare(b.released_at, 'ja'))

  let candidate: string | null = null
  for (const version of sorted) {
    const releasedAt = version.released_at.slice(0, 10)
    if (normalizedReleaseDate >= releasedAt) {
      candidate = version.name
    }
  }

  return candidate ?? '不明'
}

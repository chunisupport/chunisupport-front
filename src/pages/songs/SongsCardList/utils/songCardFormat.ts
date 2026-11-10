import type { VersionSummaryDTO } from '../../../../types/api'
import { resolveVersionNameByReleaseDate } from '../../../../utils/versionConverter'

/** 未設定時の表示 */
const EMPTY = '-'

/**
 * 追加日を YYYY/MM/DD 形式へ整形する。
 *
 * @param release - YYYY-MM-DD の追加日。
 * @returns 表示文字列。未設定や不正値はハイフン。
 */
export const formatSongCardReleaseDate = (release: string | null): string => {
  if (!release) return EMPTY
  const matched = release.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!matched) return EMPTY
  return `${matched[1]}/${matched[2]}/${matched[3]}`
}

/**
 * 追加日からカード表示用のフルバージョン名を返す。
 *
 * @param release - YYYY-MM-DD の追加日。
 * @param versions - バージョン一覧。
 * @returns CHUNITHM を含むフルバージョン名。日付が無い場合は null。
 */
export const formatSongCardReleaseVersion = (
  release: string | null,
  versions: readonly VersionSummaryDTO[]
): string | null => {
  if (formatSongCardReleaseDate(release) === EMPTY) return null
  return resolveVersionNameByReleaseDate(release, versions)
}

/**
 * 追加日とバージョン名をカードの title 用に整形する。
 *
 * @param release - YYYY-MM-DD の追加日。
 * @param versions - バージョン一覧。
 * @returns `YYYY/MM/DD フルバージョン名`。日付が無い場合はハイフン。
 */
export const formatSongCardReleaseLine = (
  release: string | null,
  versions: readonly VersionSummaryDTO[]
): string => {
  const dateText = formatSongCardReleaseDate(release)
  const versionName = formatSongCardReleaseVersion(release, versions)
  if (dateText === EMPTY || versionName == null) return EMPTY
  return `${dateText} ${versionName}`
}

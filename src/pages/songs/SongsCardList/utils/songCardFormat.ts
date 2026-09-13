import type { VersionSummaryDTO } from '../../../../types/api'
import {
  getShortVersionName,
  resolveVersionNameByReleaseDate,
} from '../../../../utils/versionConverter'

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
 * 追加日とバージョン名をカード表示用に整形する。
 *
 * @param release - YYYY-MM-DD の追加日。
 * @param versions - バージョン一覧。
 * @returns `YYYY/MM/DD (バージョン)`。日付が無い場合はハイフン。
 */
export const formatSongCardReleaseLine = (
  release: string | null,
  versions: readonly VersionSummaryDTO[]
): string => {
  const dateText = formatSongCardReleaseDate(release)
  if (dateText === EMPTY) return EMPTY
  const versionName = getShortVersionName(resolveVersionNameByReleaseDate(release, versions))
  return `${dateText} (${versionName})`
}

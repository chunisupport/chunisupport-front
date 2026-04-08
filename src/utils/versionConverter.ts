import type { VersionDTO, VersionSummaryDTO } from '../types/api'

type VersionLike = Pick<VersionDTO, 'name' | 'released_at'> | VersionSummaryDTO

const ORIGINAL_VERSION_NAMES = new Set(['CHUNITHM', 'CHUNITHM PLUS'])

/** バージョン名の短縮表示を返す */
export function getShortVersionName(versionName: string): string {
  const normalized = versionName.trim()
  if (ORIGINAL_VERSION_NAMES.has(normalized)) {
    return normalized
  }

  return normalized.replace(/^CHUNITHM\s+/, '')
}

/** リリース日から該当するバージョン名を返す */
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

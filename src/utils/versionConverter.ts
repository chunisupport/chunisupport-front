import type { VersionDTO, VersionSummaryDTO } from '../types/api'

type VersionLike = Pick<VersionDTO, 'name' | 'released_at'> | VersionSummaryDTO

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

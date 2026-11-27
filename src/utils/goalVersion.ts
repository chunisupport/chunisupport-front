import type { VersionDTO, VersionSummaryDTO } from '../types/api'
import { filterReleasedVersions, getShortVersionName } from './versionConverter'

export type GoalVersionOption = {
  /** バージョンの公開ID。目標の `attributes.ver` に保存する値 */
  value: string
  label: string
}

/**
 * 目標条件で利用するバージョン一覧をリリース日順に並べる。
 *
 * @param versions - API から返されたバージョン一覧。
 * @returns リリース日順、同日なら名前順で安定化したバージョン一覧。
 */
export const sortGoalVersionsByReleaseDate = <T extends VersionSummaryDTO>(
  versions: readonly T[]
): T[] =>
  [...versions].sort((left, right) => {
    const releaseOrder = left.released_at.localeCompare(right.released_at, 'ja')
    if (releaseOrder !== 0) return releaseOrder
    return left.name.localeCompare(right.name, 'ja')
  })

/**
 * 目標条件のバージョン選択肢をリリース日順に作る。
 * 値にはバージョンの公開IDを使うため、改名やバージョン追加で保存済みの目標条件は変わらない。
 *
 * @param versions - `/internal/master` から返された公開ID付きのバージョン一覧。
 * @param referenceDate - 公開済み判定に使うCHUNITHM運用日（YYYY-MM-DD、JST 07:00切替）。既定は現在の運用日。
 * @returns チェックボックスに描画する選択肢。
 */
export const buildGoalVersionOptions = (
  versions: readonly VersionDTO[],
  referenceDate?: string
): GoalVersionOption[] =>
  sortGoalVersionsByReleaseDate(filterReleasedVersions(versions, referenceDate)).map((version) => ({
    value: version.id,
    label: getShortVersionName(version.name),
  }))

/**
 * 目標条件のバージョン公開IDから表示名を引く Map を作る。
 *
 * @param versions - `/internal/master` から返された公開ID付きのバージョン一覧。
 * @param referenceDate - 公開済み判定に使うCHUNITHM運用日（YYYY-MM-DD、JST 07:00切替）。既定は現在の運用日。
 * @returns バージョンの公開IDをキーにした表示名 Map。
 */
export const buildGoalVersionNameMap = (
  versions: readonly VersionDTO[],
  referenceDate?: string
): Map<string, string> =>
  new Map(
    buildGoalVersionOptions(versions, referenceDate).map((version) => [
      version.value,
      version.label,
    ])
  )

/** バージョン一覧ごとの、リリース日からバージョン公開IDへの解決結果キャッシュ */
const goalVersionIdCache = new WeakMap<readonly VersionDTO[], Map<string, string | undefined>>()

/**
 * 正規化済みのリリース日から、そのリリース日を含むバージョンの公開IDを求める。
 *
 * @param normalizedReleaseDate - YYYY-MM-DD 形式のリリース日。
 * @param sortedVersions - リリース日順に並べたバージョン一覧。
 * @returns 直近のバージョンの公開ID。該当しない場合は undefined。
 */
const findGoalVersionId = (
  normalizedReleaseDate: string,
  sortedVersions: readonly VersionDTO[]
): string | undefined => {
  let candidate: string | undefined
  for (const version of sortedVersions) {
    if (normalizedReleaseDate >= version.released_at.slice(0, 10)) {
      candidate = version.id
    }
  }
  return candidate
}

/**
 * 曲のリリース日から目標条件用のバージョン公開IDを解決する。
 *
 * 目標の進捗計算では全譜面に対して呼ばれるため、同じバージョン一覧に対する解決結果をリリース日単位でキャッシュする。
 * バージョン一覧はAPI取得後に変更しない前提で、配列の参照をキャッシュキーにする。
 *
 * @param releaseDate - 曲のリリース日。
 * @param versions - `/internal/master` から返された公開ID付きのバージョン一覧。
 * @returns 曲が属するバージョンの公開ID。不明な場合は undefined。
 */
export const resolveGoalVersionIdByReleaseDate = (
  releaseDate: string | null,
  versions: readonly VersionDTO[]
): string | undefined => {
  if (!releaseDate) return undefined

  const normalizedReleaseDate = releaseDate.slice(0, 10)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(normalizedReleaseDate)) return undefined

  let cache = goalVersionIdCache.get(versions)
  if (!cache) {
    cache = new Map()
    goalVersionIdCache.set(versions, cache)
  }
  if (cache.has(normalizedReleaseDate)) return cache.get(normalizedReleaseDate)

  const id = findGoalVersionId(normalizedReleaseDate, sortGoalVersionsByReleaseDate(versions))
  cache.set(normalizedReleaseDate, id)
  return id
}

import type { VersionDTO } from '../types/api'
import { filterReleasedVersions, getShortVersionName } from './versionConverter'

export type GoalVersionOption = {
  value: string
  numericValue: number
  label: string
}

/**
 * 目標条件で利用するバージョン一覧をリリース日順に並べる。
 *
 * @param versions - API から返されたバージョン一覧。
 * @returns リリース日順、同日なら名前順で安定化したバージョン一覧。
 */
export const sortGoalVersionsByReleaseDate = (versions: readonly VersionDTO[]): VersionDTO[] =>
  [...versions].sort((left, right) => {
    const releaseOrder = left.released_at.localeCompare(right.released_at, 'ja')
    if (releaseOrder !== 0) return releaseOrder
    return left.name.localeCompare(right.name, 'ja')
  })

/**
 * 目標条件のバージョン選択肢をリリース日順の番号で作る。
 *
 * 未来分は除外してから番号を振る。末尾追加のみの運用では公開済みの番号は不変になる。
 * 進捗側の解決は全件で行い、未来曲が未来番号になることで現行目標から外れる。
 *
 * @param versions - API から返されたバージョン一覧。
 * @param referenceDate - 公開済み判定に使うYYYY-MM-DD形式の基準日。既定はJST今日。
 * @returns チェックボックスに描画する選択肢。
 */
export const buildGoalVersionOptions = (
  versions: readonly VersionDTO[],
  referenceDate?: string
): GoalVersionOption[] =>
  sortGoalVersionsByReleaseDate(filterReleasedVersions(versions, referenceDate)).map(
    (version, index) => {
      const numericValue = index + 1
      return {
        value: String(numericValue),
        numericValue,
        label: getShortVersionName(version.name),
      }
    }
  )

/**
 * 目標条件のバージョン番号から表示名を引く Map を作る。
 *
 * @param versions - API から返されたバージョン一覧。
 * @param referenceDate - 公開済み判定に使うYYYY-MM-DD形式の基準日。既定はJST今日。
 * @returns リリース日順番号をキーにした表示名 Map。
 */
export const buildGoalVersionNameMap = (
  versions: readonly VersionDTO[],
  referenceDate?: string
): Map<number, string> =>
  new Map(
    buildGoalVersionOptions(versions, referenceDate).map((version) => [
      version.numericValue,
      version.label,
    ])
  )

/** バージョン一覧ごとの、リリース日からバージョン番号への解決結果キャッシュ */
const goalVersionValueCache = new WeakMap<readonly VersionDTO[], Map<string, number | undefined>>()

/**
 * 正規化済みのリリース日からバージョン番号を求める。
 *
 * @param normalizedReleaseDate - YYYY-MM-DD 形式のリリース日。
 * @param sortedVersions - リリース日順に並べたバージョン一覧。
 * @returns リリース日順の 1 始まり番号。該当しない場合は undefined。
 */
const findGoalVersionValue = (
  normalizedReleaseDate: string,
  sortedVersions: readonly VersionDTO[]
): number | undefined => {
  let candidate: number | undefined
  sortedVersions.forEach((version, index) => {
    if (normalizedReleaseDate >= version.released_at.slice(0, 10)) {
      candidate = index + 1
    }
  })
  return candidate
}

/**
 * 曲のリリース日から目標条件用のバージョン番号を解決する。
 *
 * 目標の進捗計算では全譜面に対して呼ばれるため、同じバージョン一覧に対する解決結果をリリース日単位でキャッシュする。
 * バージョン一覧はAPI取得後に変更しない前提で、配列の参照をキャッシュキーにする。
 *
 * @param releaseDate - 曲のリリース日。
 * @param versions - API から返されたバージョン一覧。
 * @returns リリース日順の 1 始まり番号。不明な場合は undefined。
 */
export const resolveGoalVersionValueByReleaseDate = (
  releaseDate: string | null,
  versions: readonly VersionDTO[]
): number | undefined => {
  if (!releaseDate) return undefined

  const normalizedReleaseDate = releaseDate.slice(0, 10)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(normalizedReleaseDate)) return undefined

  let cache = goalVersionValueCache.get(versions)
  if (!cache) {
    cache = new Map()
    goalVersionValueCache.set(versions, cache)
  }
  if (cache.has(normalizedReleaseDate)) return cache.get(normalizedReleaseDate)

  const value = findGoalVersionValue(normalizedReleaseDate, sortGoalVersionsByReleaseDate(versions))
  cache.set(normalizedReleaseDate, value)
  return value
}

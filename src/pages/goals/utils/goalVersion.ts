import type { VersionDTO } from '../../../types/api.ts'
import { getShortVersionName } from '../../../utils/versionConverter.ts'

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
 * @param versions - API から返されたバージョン一覧。
 * @returns チェックボックスに描画する選択肢。
 */
export const buildGoalVersionOptions = (versions: readonly VersionDTO[]): GoalVersionOption[] =>
  sortGoalVersionsByReleaseDate(versions).map((version, index) => {
    const numericValue = index + 1
    return {
      value: String(numericValue),
      numericValue,
      label: getShortVersionName(version.name),
    }
  })

/**
 * 目標条件のバージョン番号から表示名を引く Map を作る。
 *
 * @param versions - API から返されたバージョン一覧。
 * @returns リリース日順番号をキーにした表示名 Map。
 */
export const buildGoalVersionNameMap = (versions: readonly VersionDTO[]): Map<number, string> =>
  new Map(buildGoalVersionOptions(versions).map((version) => [version.numericValue, version.label]))

/**
 * 曲のリリース日から目標条件用のバージョン番号を解決する。
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

  let candidate: number | undefined
  sortGoalVersionsByReleaseDate(versions).forEach((version, index) => {
    if (normalizedReleaseDate >= version.released_at.slice(0, 10)) {
      candidate = index + 1
    }
  })

  return candidate
}

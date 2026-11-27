import { HONOR_IMAGE_BASE_URL } from '../constants/honors'
import type { AdminHonorDTO } from '../types/api'
import { formatJstDateTimeMinute } from './jstDateTime'

export type AdminHonorSortKey = 'id' | 'name' | 'type' | 'created-at' | 'image-url'
export type AdminHonorSort = `${AdminHonorSortKey}-${'asc' | 'desc'}`

/**
 * APIの画像名または画像URLから公式画像へのリンクを作る。
 *
 * @param imageUrl - APIが返した画像名または画像URL。
 * @returns 公式画像ディレクトリ内の画像URL。
 */
export const buildAdminHonorImageHref = (imageUrl: string): string => {
  const imagePath = new URL(imageUrl, HONOR_IMAGE_BASE_URL).pathname
  const imageName = imagePath.substring(imagePath.lastIndexOf('/') + 1)
  return `${HONOR_IMAGE_BASE_URL}${imageName}`
}

/**
 * 列見出しを選択したときの次の並べ替え条件を返す。
 *
 * @param current - 現在の並べ替え条件。
 * @param key - 選択した列。
 * @returns 次の並べ替え条件。
 */
export const nextAdminHonorSort = (
  current: AdminHonorSort,
  key: AdminHonorSortKey
): AdminHonorSort => {
  const ascending: AdminHonorSort = `${key}-asc`
  const descending: AdminHonorSort = `${key}-desc`
  if (current === ascending) return descending
  if (current === descending) return ascending
  return key === 'id' || key === 'created-at' ? descending : ascending
}

/**
 * APIの登録日時を日本時間で表示する。
 *
 * @param value - APIが返した登録日時。
 * @returns 表示用の日時。日時がない場合はハイフン。
 */
export const formatAdminHonorCreatedAt = (value: string | null): string =>
  formatJstDateTimeMinute(value) ?? '-'

/**
 * 登録日時を並べ替え用の時刻へ変換する。
 *
 * @param value - APIが返した登録日時。
 * @returns 有効な日時の時刻。日時がない場合はnull。
 */
const getCreatedAtTime = (value: string | null): number | null => {
  if (!value) return null
  const time = Date.parse(value)
  return Number.isNaN(time) ? null : time
}

/**
 * 登録日時がない称号を最後にして比較する。
 *
 * @param a - 1件目の称号。
 * @param b - 2件目の称号。
 * @param order - 日時の昇順または降順。
 * @param newerFirst - 同順のときに新しく登録された称号を先にする比較関数。
 * @returns 配列の並べ替えに使う比較結果。
 */
const compareCreatedAt = (
  a: AdminHonorDTO,
  b: AdminHonorDTO,
  order: 'asc' | 'desc',
  newerFirst: (a: AdminHonorDTO, b: AdminHonorDTO) => number
): number => {
  const aTime = getCreatedAtTime(a.created_at)
  const bTime = getCreatedAtTime(b.created_at)
  if (aTime === null) return bTime === null ? newerFirst(a, b) : 1
  if (bTime === null) return -1
  return (order === 'asc' ? aTime - bTime : bTime - aTime) || newerFirst(a, b)
}

/**
 * 称号名検索、クラス絞り込み、並べ替えを適用する。
 *
 * `id` 列の並べ替えは登録順で行う。称号の id は登録順と無関係な公開IDのため、
 * 登録順に返されるAPIの並びを基準にする。
 *
 * @param honors - APIから取得した全称号（登録順）。
 * @param query - 称号名の検索文字列。
 * @param typeName - 絞り込むクラス名。nullなら全クラス。
 * @param sort - 並べ替え条件。
 * @returns 表示条件に一致する称号一覧。
 */
export const filterAndSortAdminHonors = (
  honors: AdminHonorDTO[],
  query: string,
  typeName: string | null,
  sort: AdminHonorSort
): AdminHonorDTO[] => {
  const normalizedQuery = query.trim().normalize('NFKC').toLocaleLowerCase('ja')
  const registrationOrder = new Map(honors.map((honor, index) => [honor.id, index]))
  const getRegistrationOrder = (honor: AdminHonorDTO): number =>
    registrationOrder.get(honor.id) ?? 0
  const newerFirst = (a: AdminHonorDTO, b: AdminHonorDTO): number =>
    getRegistrationOrder(b) - getRegistrationOrder(a)

  return honors
    .filter(
      (honor) =>
        (typeName === null || honor.type_name === typeName) &&
        honor.name.normalize('NFKC').toLocaleLowerCase('ja').includes(normalizedQuery)
    )
    .sort((a, b) => {
      switch (sort) {
        case 'id-asc':
          return getRegistrationOrder(a) - getRegistrationOrder(b)
        case 'name-asc':
          return a.name.localeCompare(b.name, 'ja') || newerFirst(a, b)
        case 'name-desc':
          return b.name.localeCompare(a.name, 'ja') || newerFirst(a, b)
        case 'type-asc':
          return a.type_name.localeCompare(b.type_name, 'ja') || newerFirst(a, b)
        case 'type-desc':
          return b.type_name.localeCompare(a.type_name, 'ja') || newerFirst(a, b)
        case 'image-url-asc':
          return a.image_url.localeCompare(b.image_url, 'ja') || newerFirst(a, b)
        case 'image-url-desc':
          return b.image_url.localeCompare(a.image_url, 'ja') || newerFirst(a, b)
        case 'created-at-asc':
          return compareCreatedAt(a, b, 'asc', newerFirst)
        case 'created-at-desc':
          return compareCreatedAt(a, b, 'desc', newerFirst)
        default:
          return newerFirst(a, b)
      }
    })
}

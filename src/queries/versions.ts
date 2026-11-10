import { requestCreateVersion, requestDeleteVersion, requestRenameVersion } from '../api/versions'
import type { CreateVersionRequestDTO, RenameVersionRequestDTO } from '../types/api'
import { invalidateVersionCaches } from './masterData'

/**
 * バージョンを作成し、公開一覧と全マスタのqueryを破棄する。
 * @param request - 作成するバージョンの属性。
 * @returns 作成したバージョン。
 */
export const createVersion = async (request: CreateVersionRequestDTO) => {
  const version = await requestCreateVersion(request)
  invalidateVersionCaches()
  return version
}

/**
 * バージョンを改名し、公開一覧と全マスタのqueryを破棄する。
 * @param id - 対象バージョンID。
 * @param request - 変更後の名前と超ショート名。
 * @returns 更新したバージョン。
 */
export const renameVersion = async (id: number, request: RenameVersionRequestDTO) => {
  const version = await requestRenameVersion(id, request)
  invalidateVersionCaches()
  return version
}

/**
 * バージョンを削除し、公開一覧と全マスタのqueryを破棄する。
 * @param id - 対象バージョンID。
 * @returns 削除と無効化の完了を表すPromise。
 */
export const deleteVersion = async (id: number): Promise<void> => {
  await requestDeleteVersion(id)
  invalidateVersionCaches()
}

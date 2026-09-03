import { API_BASE_URL } from '../config'
import type { CreateVersionRequestDTO, RenameVersionRequestDTO, VersionDTO } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'
import { invalidateVersionCaches } from './songs'

const ADMIN_VERSIONS_API_PATH = `${API_BASE_URL}/internal/admin/versions`

/**
 * 未来版を含む管理者向けバージョン一覧を取得する。
 *
 * @returns 稼働日昇順のバージョン一覧。
 */
export const fetchAdminVersions = async (): Promise<VersionDTO[]> => {
  const response = await fetchWithAuth(ADMIN_VERSIONS_API_PATH, {
    requireAuthentication: true,
  })
  return response.json()
}

/**
 * バージョンを新規作成する。
 *
 * @param request - バージョン名と稼働日。
 * @returns 作成したバージョン。
 */
export const createVersion = async (request: CreateVersionRequestDTO): Promise<VersionDTO> => {
  const response = await fetchWithAuth(ADMIN_VERSIONS_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    requireAuthentication: true,
  })
  const version = (await response.json()) as VersionDTO
  invalidateVersionCaches()
  return version
}

/**
 * 指定したバージョンの名前を変更する。
 *
 * @param id - 更新対象のバージョンID。
 * @param request - 変更後のバージョン名。
 * @returns 更新したバージョン。
 */
export const renameVersion = async (
  id: number,
  request: RenameVersionRequestDTO
): Promise<VersionDTO> => {
  const response = await fetchWithAuth(`${ADMIN_VERSIONS_API_PATH}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    requireAuthentication: true,
  })
  const version = (await response.json()) as VersionDTO
  invalidateVersionCaches()
  return version
}

/**
 * 指定した最新版バージョンを削除する。
 *
 * @param id - 削除対象のバージョンID。
 * @returns 削除完了時に解決するPromise。
 */
export const deleteVersion = async (id: number): Promise<void> => {
  await fetchWithAuth(`${ADMIN_VERSIONS_API_PATH}/${id}`, {
    method: 'DELETE',
    requireAuthentication: true,
  })
  invalidateVersionCaches()
}

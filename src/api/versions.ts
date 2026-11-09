import { API_BASE_URL } from '../config'
import type { CreateVersionRequestDTO, RenameVersionRequestDTO, VersionDTO } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

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
 * @param request - バージョン名、超ショート名と稼働日。
 * @returns 作成したバージョン。
 */
export const requestCreateVersion = async (
  request: CreateVersionRequestDTO
): Promise<VersionDTO> => {
  const response = await fetchWithAuth(ADMIN_VERSIONS_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    requireAuthentication: true,
  })
  return response.json()
}

/**
 * 指定したバージョンの名前と超ショート名を変更する。
 *
 * @param id - 更新対象のバージョンID。
 * @param request - 変更後のバージョン名と超ショート名。
 * @returns 更新したバージョン。
 */
export const requestRenameVersion = async (
  id: number,
  request: RenameVersionRequestDTO
): Promise<VersionDTO> => {
  const response = await fetchWithAuth(`${ADMIN_VERSIONS_API_PATH}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    requireAuthentication: true,
  })
  return response.json()
}

/**
 * 指定した最新版バージョンを削除する。
 *
 * @param id - 削除対象のバージョンID。
 * @returns 削除完了時に解決するPromise。
 */
export const requestDeleteVersion = async (id: number): Promise<void> => {
  await fetchWithAuth(`${ADMIN_VERSIONS_API_PATH}/${id}`, {
    method: 'DELETE',
    requireAuthentication: true,
  })
}

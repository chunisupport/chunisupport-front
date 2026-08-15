import { API_BASE_URL } from '../config'
import type { SystemStatusDTO, UpdateMaintenanceRequest } from '../types/api'
import { parseSystemStatusDTO } from '../utils/systemStatus'
import { fetchWithAuth } from './fetchWithAuth'
import { fetchSystemStatus } from './maintenanceStatus'

const ADMIN_MAINTENANCE_API_PATH = `${API_BASE_URL}/internal/admin/maintenance`

export { fetchSystemStatus }

/**
 * 管理者権限でメンテナンス状態と表示コメントを更新する。
 *
 * @param request - 有効状態と正規化済みコメント。
 * @returns 更新後のシステム状態。
 */
export const updateMaintenance = async (
  request: UpdateMaintenanceRequest
): Promise<SystemStatusDTO> => {
  const response = await fetchWithAuth(ADMIN_MAINTENANCE_API_PATH, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    requireAuthentication: true,
  })

  return parseSystemStatusDTO(await response.json())
}

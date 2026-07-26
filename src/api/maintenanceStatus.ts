import { API_BASE_URL } from '../config'
import type { SystemStatusDTO } from '../types/api'
import { parseSystemStatusDTO } from '../utils/systemStatus'

const SYSTEM_STATUS_API_PATH = `${API_BASE_URL}/internal/system/status`
const SYSTEM_STATUS_FETCH_ERROR_MESSAGE = 'システム状態の取得に失敗しました'

/**
 * 認証を待たずにAPIのシステム状態を取得する。
 *
 * @param signal - 呼び出しを中止するAbortSignal。
 * @returns 現在のシステム状態。
 * @throws APIへ接続できない、またはレスポンス形式が不正な場合。
 */
export const fetchSystemStatus = async (signal?: AbortSignal): Promise<SystemStatusDTO> => {
  const response = await fetch(SYSTEM_STATUS_API_PATH, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error(SYSTEM_STATUS_FETCH_ERROR_MESSAGE)
  }

  return parseSystemStatusDTO(await response.json())
}

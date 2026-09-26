import { API_BASE_URL } from '../config'
import { t } from '../i18n'
import type { SystemStatusDTO } from '../types/api'
import { parseSystemStatusDTO } from '../utils/systemStatus'
import { fetchApi } from './fetchApi'

const SYSTEM_STATUS_API_PATH = `${API_BASE_URL}/internal/system/status`

/**
 * 認証を待たずにAPIのシステム状態を取得する。
 *
 * @param signal - 呼び出しを中止するAbortSignal。
 * @returns 現在のシステム状態。
 * @throws APIへ接続できない、またはレスポンス形式が不正な場合。
 */
export const fetchSystemStatus = async (signal?: AbortSignal): Promise<SystemStatusDTO> => {
  const response = await fetchApi(SYSTEM_STATUS_API_PATH, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error(t('errors.systemStatusFetchFailed'))
  }

  return parseSystemStatusDTO(await response.json())
}

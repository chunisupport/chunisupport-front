import { API_BASE_URL } from '../config'
import { SYSTEM_STATUS_TIMEOUT_MS } from '../constants/maintenance'
import type { SystemStatusDTO } from '../types/api'
import { parseSystemStatusDTO } from '../utils/systemStatus'
import { fetchApi } from './fetchApi'

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
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (signal?.aborted) abort()
  else signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(abort, SYSTEM_STATUS_TIMEOUT_MS)
  try {
    const response = await fetchApi(SYSTEM_STATUS_API_PATH, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(SYSTEM_STATUS_FETCH_ERROR_MESSAGE)
    return parseSystemStatusDTO(await response.json())
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}

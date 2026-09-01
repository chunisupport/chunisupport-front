import { API_BASE_URL } from '../config'
import type {
  ApiToken,
  ApiTokenIssueResponse,
  ApiTokenListResponse,
  ApiTokenRenameRequest,
  DataTransferExportFile,
  DataTransferImportResponse,
  DataTransferValidationResponse,
} from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'
import { reauthenticateAndGetToken } from './reauthenticate'

const DATA_TRANSFER_API_PATH = `${API_BASE_URL}/internal/me/data-transfer`
const DATA_TRANSFER_FILENAME_PREFIX = 'chunisupport-transfer'

/**
 * Content-Dispositionから安全なJSONファイル名を取得する。
 *
 * @param contentDisposition - APIが返したContent-Dispositionヘッダー。
 * @returns 利用可能なJSONファイル名。取得できない場合は現在日時を含む既定名。
 */
const resolveDataTransferFilename = (contentDisposition: string | null): string => {
  const matchedFilename = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1]
  if (matchedFilename && /^[a-zA-Z0-9._-]+\.json$/.test(matchedFilename)) {
    return matchedFilename
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
  return `${DATA_TRANSFER_FILENAME_PREFIX}-${timestamp}.json`
}

export const fetchPrivacy = async (): Promise<{ is_private: boolean }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me`, {
    method: 'GET',
  })

  const data = (await response.json()) as { is_private: boolean }
  return { is_private: data.is_private }
}

export const updatePrivacy = async (isPrivate: boolean): Promise<{ is_private: boolean }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/privacy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_private: isPrivate }),
  })

  return response.json()
}

/**
 * 名前付きAPIトークンを追加発行する。
 *
 * @param name - APIトークンの表示名。
 * @returns 平文トークンと管理情報。平文はこのレスポンスでのみ取得できる。
 */
export const issueApiToken = async (name: string): Promise<ApiTokenIssueResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/auth/api-tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  return response.json()
}

/**
 * ログインユーザーが所有するAPIトークン一覧を取得する。
 *
 * @returns APIトークン管理情報の一覧。
 */
export const fetchApiTokens = async (): Promise<ApiTokenListResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/auth/api-tokens`, {
    method: 'GET',
  })

  return response.json()
}

/**
 * APIトークンの表示名を変更する。
 *
 * @param id - 変更対象のAPIトークンID。
 * @param data - 新しい表示名。
 * @returns 変更後のAPIトークン管理情報。
 */
export const renameApiToken = async (
  id: number,
  data: ApiTokenRenameRequest
): Promise<ApiToken> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/auth/api-tokens/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  return response.json()
}

/**
 * IDで指定したAPIトークンを削除する。
 *
 * @param id - 削除対象のAPIトークンID。
 * @returns 削除完了後に解決されるPromise。
 */
export const deleteApiToken = async (id: number): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/auth/api-tokens/${id}`, {
    method: 'DELETE',
  })
}

/**
 * 認証ユーザーの移行対象データを署名付きJSONとしてエクスポートする。
 *
 * @returns ダウンロードするJSON Blobとファイル名。
 */
export const exportUserDataTransfer = async (): Promise<DataTransferExportFile> => {
  const response = await fetchWithAuth(`${DATA_TRANSFER_API_PATH}/export`, {
    method: 'POST',
  })

  return {
    blob: await response.blob(),
    filename: resolveDataTransferFilename(response.headers.get('Content-Disposition')),
  }
}

/**
 * 選択された移行ファイルを検証する。
 *
 * @param file - エクスポートAPIで作成された署名付きJSONファイル。
 * @returns 移行可否、対象プレイヤー、件数、阻害理由を含む検証結果。
 */
export const validateUserDataTransfer = async (
  file: Blob
): Promise<DataTransferValidationResponse> => {
  const response = await fetchWithAuth(`${DATA_TRANSFER_API_PATH}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: file,
  })

  const validation = (await response.json()) as Omit<
    DataTransferValidationResponse,
    'blockers' | 'unresolved_references'
  > & {
    blockers: DataTransferValidationResponse['blockers'] | null
    unresolved_references: DataTransferValidationResponse['unresolved_references'] | null
  }

  return {
    ...validation,
    blockers: validation.blockers ?? [],
    unresolved_references: validation.unresolved_references ?? [],
  }
}

/**
 * 検証済みの移行ファイルを現在のアカウントへインポートする。
 *
 * @param file - 検証時と同じ署名付きJSONファイル。
 * @returns 新しいプレイヤーIDと保存件数を含む移行結果。
 */
export const importUserDataTransfer = async (file: Blob): Promise<DataTransferImportResponse> => {
  const response = await fetchWithAuth(`${DATA_TRANSFER_API_PATH}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: file,
  })

  return response.json()
}

export const deletePlayerData = async (): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/me/player-data`, {
    method: 'DELETE',
  })
}

export const deleteAccount = async (): Promise<void> => {
  const reauthToken = await reauthenticateAndGetToken()
  await fetchWithAuth(`${API_BASE_URL}/internal/me`, {
    method: 'DELETE',
    headers: { 'X-Reauth-Token': reauthToken },
    suppressUnauthorizedRedirectForCodes: ['recent_sign_in_required'],
  })
}

/**
 * 再認証済みユーザーの公開ユーザーネームを変更する。
 *
 * @param username - 新しいユーザーネーム。
 * @param reauthToken - Firebase再認証で取得したIDトークン。
 * @returns APIが確定した変更後のユーザーネーム。
 */
export const updateUsername = async (
  username: string,
  reauthToken: string
): Promise<{ username: string }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/username`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Reauth-Token': reauthToken,
    },
    body: JSON.stringify({ username }),
    suppressUnauthorizedRedirectForCodes: ['recent_sign_in_required'],
  })

  return response.json()
}

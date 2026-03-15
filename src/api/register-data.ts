import { API_BASE_URL } from '../config'
import { fetchWithAuth } from './fetchWithAuth'

type RegisterDataFormat = 'json' | 'text'

type RegisterDataPayload = {
  data: string
  format: RegisterDataFormat
}

export const postRegisterData = async (payload: RegisterDataPayload): Promise<void> => {
  const isJson = payload.format === 'json'
  await fetchWithAuth(`${API_BASE_URL}/internal/me/register-data${isJson ? '?format=json' : ''}`, {
    method: 'POST',
    headers: {
      'Content-Type': isJson ? 'application/json' : 'text/plain',
    },
    body: payload.data,
  })
}

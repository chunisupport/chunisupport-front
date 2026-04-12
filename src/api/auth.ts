import { API_BASE_URL } from '../config'
import type { UserDTO } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

type SignupPayload = {
  username: string
}

export const postSignup = async (payload: SignupPayload): Promise<UserDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return response.json()
}

export const postLogout = async (): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/auth/logout`, {
    method: 'POST',
  })
}

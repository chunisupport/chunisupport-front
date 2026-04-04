import { API_BASE_URL } from '../config'
import { getErrorMessage } from '../types/api'

type AuthPayload = {
  username: string
  password: string
}

type RecoveryResetPayload = {
  recovery_code: string
  new_password: string
}

export const postLogin = async (payload: AuthPayload): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/internal/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }
}

export const postLogout = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/internal/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }
}

// 新規登録
export const postRegister = async (payload: AuthPayload): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/internal/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }
}

export const postFirebaseLogin = async (idToken: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/internal/auth/firebase/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ id_token: idToken }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }
}

export const postRecoveryReset = async (payload: RecoveryResetPayload): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/internal/auth/recovery-codes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }
}

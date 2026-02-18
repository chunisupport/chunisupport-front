import { getErrorMessage } from '../types/api'

export const fetchWithAuth = async (
  input: string | URL,
  init: RequestInit = {}
): Promise<Response> => {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(getErrorMessage(error))
  }

  return response
}

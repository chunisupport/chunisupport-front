import { reauthenticateWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase.ts'

export const reauthenticateAndGetToken = async (): Promise<string> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error('ログインしていません。再度ログインしてください。')
  }

  const result = await reauthenticateWithPopup(user, googleProvider)
  const token = await result.user.getIdToken(true)
  return token
}

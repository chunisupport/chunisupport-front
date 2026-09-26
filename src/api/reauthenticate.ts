import { reauthenticateWithPopup } from 'firebase/auth'
import { t } from '../i18n'
import { auth, googleProvider } from '../lib/firebase'

export const reauthenticateAndGetToken = async (): Promise<string> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error(t('errors.notSignedIn'))
  }

  const result = await reauthenticateWithPopup(user, googleProvider)
  const token = await result.user.getIdToken(true)
  return token
}

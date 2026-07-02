import { getAnalytics } from 'firebase/analytics'
import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'

import { getEnv, getRequiredEnv } from './env'

const env = getEnv()

const firebaseConfig = {
  apiKey: getRequiredEnv('PUBLIC_FB_API_KEY'),
  authDomain: getRequiredEnv('PUBLIC_FB_AUTH_DOMAIN'),
  projectId: getRequiredEnv('PUBLIC_FB_PROJECT_ID'),
  storageBucket: getRequiredEnv('PUBLIC_FB_STORAGE_BUCKET'),
  messagingSenderId: getRequiredEnv('PUBLIC_FB_MESSAGING_SENDER_ID'),
  appId: getRequiredEnv('PUBLIC_FB_APP_ID'),
  measurementId: env.PUBLIC_FB_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

/** ブラウザ環境で初期化されたFirebase Analytics。 */
export const analytics = typeof window === 'undefined' ? undefined : getAnalytics(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

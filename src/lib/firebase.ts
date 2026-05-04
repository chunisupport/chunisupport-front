import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'

const env = import.meta.env ?? {}

const firebaseConfig = {
  apiKey: env.PUBLIC_FB_API_KEY ?? process.env.PUBLIC_FB_API_KEY,
  authDomain: env.PUBLIC_FB_AUTH_DOMAIN ?? process.env.PUBLIC_FB_AUTH_DOMAIN,
  projectId: env.PUBLIC_FB_PROJECT_ID ?? process.env.PUBLIC_FB_PROJECT_ID,
  storageBucket: env.PUBLIC_FB_STORAGE_BUCKET ?? process.env.PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: env.PUBLIC_FB_MESSAGING_SENDER_ID ?? process.env.PUBLIC_FB_MESSAGING_SENDER_ID,
  appId: env.PUBLIC_FB_APP_ID ?? process.env.PUBLIC_FB_APP_ID,
  measurementId: env.PUBLIC_FB_MEASUREMENT_ID ?? process.env.PUBLIC_FB_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

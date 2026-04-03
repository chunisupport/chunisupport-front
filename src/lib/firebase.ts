import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyDyXaZoiz5yQjSM5ff1-X1-QoGGm5tYJmE',
  authDomain: 'chunisupport-develop.firebaseapp.com',
  projectId: 'chunisupport-develop',
  storageBucket: 'chunisupport-develop.firebasestorage.app',
  messagingSenderId: '269920974279',
  appId: '1:269920974279:web:e77fe0be1be7d4876ad5e2',
  measurementId: 'G-V3GGF7S5F6',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

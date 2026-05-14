import { getRequiredEnv } from './lib/env.ts'

export const API_BASE_URL = getRequiredEnv('PUBLIC_BACKEND_URL')
export const CHUNITHM_JACKET_BASE_URL = 'https://reiwa.f5.si/jackets/chunithm'

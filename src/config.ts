import { getRequiredEnv } from './lib/env'

export const API_BASE_URL = getRequiredEnv('PUBLIC_BACKEND_URL')
export const CF_TURNSTILE_SITE_KEY = getRequiredEnv('PUBLIC_CF_TURNSTILE_SITE_KEY')
export const CHUNITHM_JACKET_BASE_URL = 'https://reiwa.f5.si/jackets/chunithm'

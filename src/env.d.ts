/// <reference types="@rsbuild/core/types" />

interface ImportMetaEnv {
  readonly PUBLIC_BACKEND_URL: string
  readonly PUBLIC_FB_API_KEY: string
  readonly PUBLIC_FB_AUTH_DOMAIN: string
  readonly PUBLIC_FB_PROJECT_ID: string
  readonly PUBLIC_FB_STORAGE_BUCKET: string
  readonly PUBLIC_FB_MESSAGING_SENDER_ID: string
  readonly PUBLIC_FB_APP_ID: string
  readonly PUBLIC_FB_MEASUREMENT_ID: string
  readonly PUBLIC_CF_TURNSTILE_SITE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __FRONTEND_BUILD_DATE__: string
declare const __FRONTEND_COMMIT_HASH__: string

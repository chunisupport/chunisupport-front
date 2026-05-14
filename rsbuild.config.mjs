import { defineConfig, loadEnv } from '@rsbuild/core'
import { pluginBabel } from '@rsbuild/plugin-babel'
import { pluginSolid } from '@rsbuild/plugin-solid'

const REQUIRED_PUBLIC_ENV_KEYS = [
  'PUBLIC_BACKEND_URL',
  'PUBLIC_FB_API_KEY',
  'PUBLIC_FB_AUTH_DOMAIN',
  'PUBLIC_FB_PROJECT_ID',
  'PUBLIC_FB_STORAGE_BUCKET',
  'PUBLIC_FB_MESSAGING_SENDER_ID',
  'PUBLIC_FB_APP_ID',
]

// Docs: https://rsbuild.rs/config/
export default defineConfig(({ env, envMode }) => {
  const envResult = loadEnv({ mode: envMode, prefixes: ['PUBLIC_'] })
  const missingEnvKeys = REQUIRED_PUBLIC_ENV_KEYS.filter((key) => !envResult.rawPublicVars[key])

  if (missingEnvKeys.length > 0) {
    envResult.cleanup()
    throw new Error(`必須環境変数が設定されていません: ${missingEnvKeys.join(', ')}`)
  }

  const publicEnvDefine = {
    ...envResult.publicVars,
    'import.meta.env': JSON.stringify({
      ...envResult.rawPublicVars,
      MODE: envMode,
      DEV: env === 'development',
      PROD: env === 'production',
      BASE_URL: '/',
    }),
  }
  envResult.cleanup()

  return {
    source: {
      define: publicEnvDefine,
    },
    html: {
      title: 'ChuniSupport',
      meta: {
        robots: 'noindex',
      },
      tags: [
        {
          tag: 'link',
          attrs: {
            rel: 'preconnect',
            href: 'https://fonts.googleapis.com',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'preconnect',
            href: 'https://fonts.gstatic.com',
            crossorigin: true,
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Jost:ital,wght@0,100..900;1,100..900&family=Noto+Sans:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&family=Oswald:wght@200..700&display=swap',
          },
        },
      ],
    },
    plugins: [
      pluginBabel({
        include: /\.(?:jsx|tsx)$/,
      }),
      pluginSolid(),
    ],
  }
})

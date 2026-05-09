import { defineConfig } from '@rsbuild/core'
import { pluginBabel } from '@rsbuild/plugin-babel'
import { pluginSolid } from '@rsbuild/plugin-solid'

// Docs: https://rsbuild.rs/config/
export default defineConfig({
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
})

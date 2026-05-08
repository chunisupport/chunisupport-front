export default {
  theme: {
    extend: {
      colors: {
        // テーマカラー: ここを変えるだけで全体の色が変わります
        primary: {
          50: 'var(--color-green-50)',
          100: 'var(--color-green-100)',
          200: 'var(--color-green-200)',
          300: 'var(--color-green-300)',
          400: 'var(--color-green-400)',
          500: 'var(--color-green-500)',
          600: 'var(--color-green-600)',
          700: 'var(--color-green-700)',
          800: 'var(--color-green-800)',
          900: 'var(--color-green-900)',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans JP"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif JP"', 'ui-serif', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        oswald: ['"Oswald"', 'sans-serif'],
      },
    },
  },
}

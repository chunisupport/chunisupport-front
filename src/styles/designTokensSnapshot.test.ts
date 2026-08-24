import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const tailwindCssPath = path.resolve(process.cwd(), 'src/styles/tailwind.css')
const tailwindCssContent = readFileSync(tailwindCssPath, 'utf8')

/**
 * CSSファイルから指定されたカスタムプロパティ定義を抽出する。
 * @param css CSS全文
 * @param property 取得対象のプロパティ名
 * @returns 取得した定義値
 */
const readCustomProperty = (css: string, property: string): string => {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matched = css.match(new RegExp(`${escapedProperty}:\\s*([^;]+);`))
  assert.ok(matched, `${property} が定義されている必要があります`)
  return matched[1].trim()
}

/**
 * CSSファイルから指定されたカスタムプロパティの全定義値を抽出する。
 * @param css CSS全文
 * @param property 取得対象のプロパティ名
 * @returns テーマごとに定義された値
 */
const readCustomProperties = (css: string, property: string): string[] => {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return Array.from(css.matchAll(new RegExp(`${escapedProperty}:\\s*([^;]+);`, 'g')), ([, value]) =>
    value.trim()
  )
}

test('既存色と同じ値でデザイントークンが定義されていること', () => {
  const expectedMappings = [
    ['--cs-color-bg', 'var(--color-white)'],
    ['--cs-color-surface', 'var(--color-white)'],
    ['--cs-color-text-muted', 'var(--color-gray-600)'],
    ['--cs-color-nav-text', 'var(--color-gray-700)'],
    ['--cs-color-border', 'var(--color-gray-300)'],
    ['--cs-color-action-primary', 'var(--color-primary-600)'],
    ['--cs-color-action-primary-hover', 'var(--color-primary-700)'],
    ['--cs-color-select-selected-hover-bg', 'var(--color-primary-100)'],
    ['--cs-color-danger', 'var(--color-red-600)'],
    ['--cs-color-danger-bg', 'var(--color-red-50)'],
    ['--cs-color-success-bg', 'var(--color-green-50)'],
    ['--cs-color-overlay', 'rgb(0 0 0 / 30%)'],
    ['--cs-color-difficulty-basic-bg', '#00ab84'],
    ['--cs-color-difficulty-basic-text', 'var(--color-white)'],
    ['--cs-color-honor-title-normal-bg', 'var(--color-yellow-200)'],
    ['--cs-color-honor-title-normal-text', 'var(--color-gray-900)'],
    ['--cs-color-ranking-gold-bg', 'var(--color-yellow-300)'],
    ['--cs-color-ranking-silver-bg', 'var(--color-gray-300)'],
    ['--cs-color-ranking-bronze-bg', 'var(--color-orange-300)'],
    ['--cs-color-ranking-medal-text', 'var(--color-gray-900)'],
    ['--cs-color-score-rank-sssp-bg', 'var(--color-green-500)'],
    ['--cs-color-score-rank-sssp-text', 'var(--color-green-500)'],
    ['--cs-color-score-rank-sss-bg', 'var(--color-yellow-500)'],
    ['--cs-color-score-rank-sss-text', 'var(--color-yellow-500)'],
    ['--cs-color-score-difference-negative', 'var(--color-blue-700)'],
  ] as const

  for (const [tokenName, expectedValue] of expectedMappings) {
    assert.equal(readCustomProperty(tailwindCssContent, tokenName), expectedValue)
  }
})

test('Tailwind公開トークンがcsトークンへ接続されていること', () => {
  const expectedBindings = [
    ['--color-bg', 'var(--cs-color-bg)'],
    ['--color-surface', 'var(--cs-color-surface)'],
    ['--color-text-muted', 'var(--cs-color-text-muted)'],
    ['--color-nav-text', 'var(--cs-color-nav-text)'],
    ['--color-border', 'var(--cs-color-border)'],
    ['--color-action-primary', 'var(--cs-color-action-primary)'],
    ['--color-action-primary-hover', 'var(--cs-color-action-primary-hover)'],
    ['--color-select-selected-hover-bg', 'var(--cs-color-select-selected-hover-bg)'],
    ['--color-new-song-bg', 'var(--cs-color-new-song-bg)'],
    ['--color-danger', 'var(--cs-color-danger)'],
    ['--color-danger-bg', 'var(--cs-color-danger-bg)'],
    ['--color-success-bg', 'var(--cs-color-success-bg)'],
    ['--color-overlay', 'var(--cs-color-overlay)'],
    ['--color-difficulty-basic-bg', 'var(--cs-color-difficulty-basic-bg)'],
    ['--color-difficulty-basic-text', 'var(--cs-color-difficulty-basic-text)'],
    ['--color-honor-title-normal-bg', 'var(--cs-color-honor-title-normal-bg)'],
    ['--color-honor-title-normal-text', 'var(--cs-color-honor-title-normal-text)'],
    ['--color-ranking-gold-bg', 'var(--cs-color-ranking-gold-bg)'],
    ['--color-ranking-silver-bg', 'var(--cs-color-ranking-silver-bg)'],
    ['--color-ranking-bronze-bg', 'var(--cs-color-ranking-bronze-bg)'],
    ['--color-ranking-medal-text', 'var(--cs-color-ranking-medal-text)'],
    ['--color-score-rank-sssp-bg', 'var(--cs-color-score-rank-sssp-bg)'],
    ['--color-score-rank-sssp-text', 'var(--cs-color-score-rank-sssp-text)'],
    ['--color-score-difference-negative', 'var(--cs-color-score-difference-negative)'],
  ] as const

  for (const [colorName, expectedValue] of expectedBindings) {
    assert.equal(readCustomProperty(tailwindCssContent, colorName), expectedValue)
  }
})

test('負のスコア差はライト系とダーク系で明るさを調整した青色になること', () => {
  assert.deepEqual(
    readCustomProperties(tailwindCssContent, '--cs-color-score-difference-negative'),
    [
      'var(--color-blue-700)',
      'var(--color-blue-400)',
      'var(--color-blue-400)',
      'var(--color-blue-700)',
    ]
  )
})

test('ホバーに使う背景トークンがすべてのテーマで不透明に定義されていること', () => {
  const hoverBackgroundTokens = [
    '--cs-color-action-primary-muted',
    '--cs-color-select-selected-hover-bg',
    '--cs-color-interactive-row-hover',
    '--cs-color-danger-bg',
    '--cs-color-success-bg',
    '--cs-color-success-bg-hover',
    '--cs-color-warning-bg',
    '--cs-color-info-bg',
  ]

  for (const tokenName of hoverBackgroundTokens) {
    const definitions = readCustomProperties(tailwindCssContent, tokenName)
    assert.ok(definitions.length > 0, `${tokenName} が定義されている必要があります`)

    for (const definition of definitions) {
      assert.doesNotMatch(definition, /transparent|rgb\([^)]*\//)
    }
  }
})

test('AJCランプの虹色は虹称号と同じ色列で定義されていること', () => {
  const expectedRainbowColors = [
    '#aeefff',
    '#b7ceff',
    '#d0b5ff',
    '#ffb8e8',
    '#ffc4ad',
    '#fff0a8',
    '#b9eeb7',
  ]

  for (const [index, color] of expectedRainbowColors.entries()) {
    assert.equal(
      readCustomProperty(
        tailwindCssContent,
        `--cs-color-lamp-all-justice-critical-rainbow-${index + 1}`
      ),
      color
    )
  }

  assert.match(
    tailwindCssContent,
    /linear-gradient\(45deg, #aeefff, #b7ceff, #d0b5ff, #ffb8e8, #ffc4ad, #fff0a8, #b9eeb7\)/
  )
})

test('プラス付きスコアランクの背景は半透明の白い45度斜線であること', () => {
  assert.equal(
    readCustomProperty(tailwindCssContent, '--cs-color-score-rank-plus-stripe'),
    'rgb(255 255 255 / 25%)'
  )
  assert.equal(
    readCustomProperty(tailwindCssContent, '--cs-size-score-rank-plus-stripe-width'),
    '3px'
  )
  assert.equal(
    readCustomProperty(tailwindCssContent, '--cs-size-score-rank-plus-stripe-period'),
    '6px'
  )
  assert.equal(
    readCustomProperty(tailwindCssContent, '--cs-gradient-score-rank-plus-bg').replace(/\s+/g, ' '),
    'repeating-linear-gradient( 45deg, var(--cs-color-score-rank-plus-stripe) 0 var(--cs-size-score-rank-plus-stripe-width), transparent var(--cs-size-score-rank-plus-stripe-width) var(--cs-size-score-rank-plus-stripe-period) )'
  )
})

test('SP称号の背景は虹称号と同じ7色を0.35秒ごとに循環すること', () => {
  const expectedKeyframes = [
    ['0', 1],
    ['14.285', 2],
    ['28.57', 3],
    ['42.855', 4],
    ['57.14', 5],
    ['71.425', 6],
    ['85.71', 7],
    ['100', 1],
  ] as const

  for (const [progress, colorIndex] of expectedKeyframes) {
    assert.match(
      tailwindCssContent,
      new RegExp(
        `${progress}%\\s*{\\s*background-color: var\\(--cs-color-lamp-all-justice-critical-rainbow-${colorIndex}\\);`
      )
    )
  }

  assert.match(
    tailwindCssContent,
    /\.user-honor-title--sp\s*{\s*--honor-background: var\(--honor-shine\);\s*animation: honor-title-sp-rainbow 2\.45s linear infinite;/
  )
})

test('画像内のSP称号だけは専用の緑グラデーションで静止表示されること', () => {
  assert.equal(
    readCustomProperty(tailwindCssContent, '--cs-gradient-rating-image-sp-honor-bg').replace(
      /\s+/g,
      ' '
    ),
    'linear-gradient( 135deg, #d8f7e2 0%, #7bd89a 50%, #38b968 100% )'
  )
  assert.match(
    tailwindCssContent,
    /\.rating-image-honor-title\.user-honor-title--sp\s*{\s*--honor-background: var\(--honor-shine\), var\(--cs-gradient-rating-image-sp-honor-bg\);\s*animation: none;/
  )
})

test('AJCランプの文字色は虹背景向けの専用色で定義されていること', () => {
  assert.equal(
    readCustomProperty(tailwindCssContent, '--cs-color-lamp-all-justice-critical-text'),
    '#3f2a63'
  )
  assert.equal(
    readCustomProperty(tailwindCssContent, '--color-lamp-all-justice-critical-text'),
    'var(--cs-color-lamp-all-justice-critical-text)'
  )
})

test('コースクラスバッジの文字影が共通トークンで定義されていること', () => {
  assert.equal(
    readCustomProperty(tailwindCssContent, '--cs-shadow-course-class-text'),
    '0 1px 2px rgb(0 0 0 / 50%)'
  )
  assert.match(
    tailwindCssContent,
    /\.text-shadow-badge\s*{\s*text-shadow:\s*var\(--cs-shadow-course-class-text\);/
  )
})

test('アクセントカラーが背景テーマから独立したトークンとして定義されていること', () => {
  assert.match(tailwindCssContent, /\[data-accent="green"\]\s*{/)
  assert.match(tailwindCssContent, /\[data-accent="orange"\]\s*{/)
  assert.match(tailwindCssContent, /\[data-accent="blue"\]\s*{/)
  assert.match(tailwindCssContent, /\[data-accent="violet"\]\s*{/)
  assert.match(tailwindCssContent, /\[data-accent="yellow"\]\s*{/)
  assert.match(tailwindCssContent, /--cs-color-accent-500:\s*var\(--color-green-500\);/)
  assert.match(tailwindCssContent, /--cs-color-accent-500:\s*var\(--color-orange-500\);/)
  assert.match(tailwindCssContent, /--cs-color-accent-500:\s*var\(--color-blue-500\);/)
  assert.match(tailwindCssContent, /--cs-color-accent-500:\s*var\(--color-violet-500\);/)
  assert.match(tailwindCssContent, /--cs-color-accent-500:\s*var\(--color-yellow-500\);/)
  assert.match(tailwindCssContent, /--color-primary-500:\s*var\(--cs-color-accent-500\);/)
})

test('ダークテーマ用のcsトークンが定義されていること', () => {
  assert.match(tailwindCssContent, /:is\(\[data-theme="dark"\], \[data-theme="black"\]\)\s*{/)
  assert.match(tailwindCssContent, /--cs-color-bg:\s*#03150f;/)
  assert.match(tailwindCssContent, /--cs-color-surface:\s*#082018;/)
  assert.match(tailwindCssContent, /--cs-color-border:\s*#1d4a39;/)
  assert.match(tailwindCssContent, /--cs-color-text:\s*var\(--color-gray-50\);/)
  assert.match(tailwindCssContent, /--cs-color-overlay:\s*rgb\(0 0 0 \/ 60%\);/)
  assert.match(
    tailwindCssContent,
    /--cs-color-new-song-bg:\s*color-mix\(in oklab, var\(--color-primary-700\) 16%, transparent\);/
  )
})

test('ブラックテーマ用の無彩色トークンが定義されていること', () => {
  assert.match(tailwindCssContent, /\[data-theme="black"\]\s*{/)
  assert.match(tailwindCssContent, /--cs-color-bg:\s*#111111;/)
  assert.match(tailwindCssContent, /--cs-color-surface:\s*#181818;/)
  assert.match(tailwindCssContent, /--cs-color-surface-muted:\s*#222222;/)
  assert.match(tailwindCssContent, /--cs-color-border:\s*#444444;/)
  assert.match(tailwindCssContent, /--cs-color-input-border:\s*#666666;/)
})

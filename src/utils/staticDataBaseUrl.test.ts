import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveStaticDataBaseUrl } from './staticDataBaseUrl'

test('未設定時はフロントエンドと同じ環境の静的配信元を使う', () => {
  // Given
  const frontendUrl = 'https://chunisupport.net/app?view=tools'

  // When
  const result = resolveStaticDataBaseUrl(frontendUrl)

  // Then
  assert.equal(result, 'https://static.chunisupport.net')
})

test('明示した静的配信元は末尾のスラッシュを除いて使う', () => {
  // Given
  const configuredUrl = 'https://static.chunisup-dev.f5.si/'

  // When
  const result = resolveStaticDataBaseUrl('https://chunisupport.net', configuredUrl)

  // Then
  assert.equal(result, 'https://static.chunisup-dev.f5.si')
})

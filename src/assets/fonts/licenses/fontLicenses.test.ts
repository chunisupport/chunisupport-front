import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import {
  SELF_HOSTED_FONT_LICENSES,
  SIL_OFL_HEADING,
  SIL_OFL_VERSION_LINE,
  selfHostedFontLicensePublicPath,
} from './fontLicenses'

const LICENSES_DIRECTORY = import.meta.dirname

test('各ファミリーの OFL.txt は定義済みの著作権表示と OFL 1.1 の見出し・主要節名・末尾を含むこと', () => {
  // Given
  const licenses = SELF_HOSTED_FONT_LICENSES

  // When / Then
  assert.deepEqual(
    licenses.map((license) => license.id),
    ['jost', 'noto-sans', 'noto-sans-jp', 'oswald']
  )
  for (const license of licenses) {
    const filePath = path.join(LICENSES_DIRECTORY, license.id, 'OFL.txt')
    const bytes = readFileSync(filePath)
    const text = bytes.toString('utf8')
    const [copyright = '', , notice = ''] = text.split('\n')

    assert.equal(bytes[0], 0x43)
    assert.equal(text.includes('\r'), false)
    assert.equal(copyright, license.copyright)
    assert.equal(
      notice,
      'This Font Software is licensed under the SIL Open Font License, Version 1.1.'
    )
    assert.equal(text.includes(SIL_OFL_HEADING), true)
    assert.equal(text.includes(SIL_OFL_VERSION_LINE), true)
    assert.equal(text.includes('PERMISSION & CONDITIONS'), true)
    assert.equal(text.includes('TERMINATION'), true)
    assert.equal(text.includes('DISCLAIMER'), true)
    assert.equal(text.endsWith('OTHER DEALINGS IN THE FONT SOFTWARE.\n'), true)
    assert.equal(selfHostedFontLicensePublicPath(license.id), `/static/fonts/${license.id}/OFL.txt`)
  }
})

test('未知のフォントライセンス id は配信パスを作らないこと', () => {
  // Given
  const id = '../secrets'

  // When / Then
  assert.throws(() => selfHostedFontLicensePublicPath(id), /フォントライセンスの id が不正です/)
})

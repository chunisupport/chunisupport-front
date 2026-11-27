import assert from 'node:assert/strict'
import test from 'node:test'
import type { AppAnnouncementDTO } from '../../types/api'
import {
  type AppAnnouncementFormValue,
  buildAppAnnouncementFormValue,
  buildAppAnnouncementRequest,
  getAppAnnouncementFormErrors,
  getAppAnnouncementStatus,
} from './adminAppAnnouncement'

/** テスト用の入力値 */
const form: AppAnnouncementFormValue = {
  kind: 'message',
  title: ' お知らせ ',
  body: ' 本文 ',
  targetUrl: '/tools',
  startsAt: '2026-12-01T00:00',
  expiresAt: '2026-12-02T00:00',
}

/** テスト用のお知らせ */
const announcement: AppAnnouncementDTO = {
  id: '000000000000000a',
  kind: 'link',
  title: '新ツール',
  body: null,
  target_url: '/tools/dashboard',
  starts_at: '2026-11-30T15:00:00Z',
  expires_at: '2026-12-01T15:00:00Z',
  revision: 2,
}

test('本文型はURLをnullにし、日時をJSTのRFC3339にしたリクエストになること', () => {
  // Given & When
  const request = buildAppAnnouncementRequest(form)

  // Then
  assert.deepEqual(request, {
    kind: 'message',
    title: 'お知らせ',
    body: '本文',
    target_url: null,
    starts_at: '2026-12-01T00:00:00+09:00',
    expires_at: '2026-12-02T00:00:00+09:00',
  })
})

test('リンク型は本文をnullにしたリクエストになること', () => {
  // Given & When
  const request = buildAppAnnouncementRequest({ ...form, kind: 'link' })

  // Then
  assert.equal(request?.body, null)
  assert.equal(request?.target_url, '/tools')
})

test('必須項目の欠落や期間の逆転があるとnullになること', () => {
  // Given
  const invalidForms: AppAnnouncementFormValue[] = [
    { ...form, title: ' ' },
    { ...form, body: '' },
    { ...form, kind: 'link', targetUrl: ' ' },
    { ...form, kind: 'link', targetUrl: 'example.com' },
    { ...form, startsAt: '' },
    { ...form, expiresAt: form.startsAt },
  ]

  // When & Then
  for (const invalidForm of invalidForms) {
    assert.equal(buildAppAnnouncementRequest(invalidForm), null)
  }
})

test('編集対象からJSTの日時を持つフォーム初期値を作ること', () => {
  // Given & When
  const value = buildAppAnnouncementFormValue(announcement)

  // Then
  assert.deepEqual(value, {
    kind: 'link',
    title: '新ツール',
    body: '',
    targetUrl: '/tools/dashboard',
    startsAt: '2026-12-01T00:00',
    expiresAt: '2026-12-02T00:00',
  })
})

test('開始・終了の境界で配信状態が切り替わること', () => {
  // Given & When & Then: 開始時刻は配信中、終了時刻は終了済み
  assert.equal(
    getAppAnnouncementStatus(announcement, new Date('2026-11-30T14:59:59Z')),
    'scheduled'
  )
  assert.equal(getAppAnnouncementStatus(announcement, new Date('2026-11-30T15:00:00Z')), 'active')
  assert.equal(getAppAnnouncementStatus(announcement, new Date('2026-12-01T15:00:00Z')), 'ended')
})

test('入力済みの不正なURLと期間の逆転だけを項目のエラーにすること', () => {
  // Given & When & Then: 未入力はエラーにしない
  assert.deepEqual(getAppAnnouncementFormErrors({ ...form, kind: 'link', targetUrl: '' }), {
    targetUrl: false,
    expiresAt: false,
  })
  assert.deepEqual(
    getAppAnnouncementFormErrors({
      ...form,
      kind: 'link',
      targetUrl: 'javascript:alert(1)',
      expiresAt: form.startsAt,
    }),
    { targetUrl: true, expiresAt: true }
  )
  assert.equal(
    getAppAnnouncementFormErrors({ ...form, targetUrl: 'example.com' }).targetUrl,
    false,
    '本文型では遷移先を使わない'
  )
})

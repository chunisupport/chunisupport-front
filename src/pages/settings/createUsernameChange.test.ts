import test from 'node:test'
import { runSolidBrowserScript } from '../../test/runSolidBrowserScript'

/**
 * ブラウザ向けSolidの実行条件でユーザーネーム変更Primitiveを検証する。
 *
 * 検証コードでは次の値を利用できる。
 * - `setup(overrides)`: 現在のユーザーネームを `alice` としてPrimitiveを生成し、`{ change, calls, dispose }` を返す。
 *   `calls` には再認証・変更・変更完了通知が呼ばれた順に記録される。
 * - `codedError(code, status)`: コード付きのエラーを作成する。
 * - `COPY`: ユーザーネーム変更欄の表示文言。
 *
 * @param script - Primitiveを操作する検証コード。
 * @returns 検証終了時に解決するPromise。
 */
const runUsernameChangeTest = (script: string): Promise<void> =>
  runSolidBrowserScript(`
import assert from 'node:assert/strict'
import { createRoot } from 'solid-js'
import { createUsernameChange } from './src/pages/settings/createUsernameChange.ts'
import { USERNAME_CHANGE_COPY as COPY } from './src/pages/settings/AccountSettings.constants.ts'

const codedError = (code, status) => Object.assign(new Error('raw'), { code, status })
const setup = (overrides = {}) => {
  const calls = []
  return createRoot((dispose) => {
    const change = createUsernameChange({
      currentUsername: () => 'alice',
      reauthenticate: async () => {
        calls.push('reauthenticate')
        return 'reauth-token'
      },
      updateUsername: async (username, reauthToken) => {
        calls.push(['update', username, reauthToken])
        return { username }
      },
      onChanged: async (username) => {
        calls.push(['changed', username])
      },
      ...overrides,
    })
    return { change, calls, dispose }
  })
}
${script}
`)

test('入力が不正または現在と同じ場合は再認証せず入力欄にエラーを出すこと', async () => {
  await runUsernameChangeTest(`
// Given: 大文字を含む入力
const { change, calls, dispose } = setup()
change.setUsername('Alice01')

// When: 送信する
await change.submit()

// Then: 形式エラーを表示し、再認証しない
assert.equal(change.error(), COPY.invalid)
assert.deepEqual(calls, [])

// When: 現在と同じユーザーネームで送信する
change.setUsername('alice')
assert.equal(change.error(), '')
await change.submit()

// Then: 変更なしのエラーを表示する
assert.equal(change.error(), COPY.unchanged)
assert.deepEqual(calls, [])
dispose()
`)
})

test('変更成功時は再認証トークンで変更して確定値を通知し、入力を空にすること', async () => {
  await runUsernameChangeTest(`
// Given: 有効な新しいユーザーネーム
const { change, calls, dispose } = setup({
  updateUsername: async (username, reauthToken) => {
    calls.push(['update', username, reauthToken])
    return { username: 'bob123' }
  },
})
change.setUsername('bob12')

// When: 送信する
await change.submit()

// Then: 再認証、変更、APIの確定値の通知の順に行い、成功文言を出す
assert.deepEqual(calls, ['reauthenticate', ['update', 'bob12', 'reauth-token'], ['changed', 'bob123']])
assert.equal(change.username(), '')
assert.equal(change.success(), COPY.success)
assert.equal(change.error(), '')
assert.equal(change.submitting(), false)

// When: 入力し直す
change.setUsername('carol')

// Then: 前回の成功文言を消す
assert.equal(change.success(), '')
dispose()
`)
})

test('再認証で別アカウントが選ばれた場合は入力欄にエラーを出し、入力を残すこと', async () => {
  await runUsernameChangeTest(`
// Given: auth/user-mismatchで失敗する再認証
const { change, calls, dispose } = setup({
  reauthenticate: async () => {
    throw codedError('auth/user-mismatch')
  },
})
change.setUsername('bob12')

// When: 送信する
await change.submit()

// Then: 入力欄にエラーを表示し、変更APIは呼ばない
assert.equal(change.error(), COPY.userMismatch)
assert.equal(change.username(), 'bob12')
assert.deepEqual(calls, [])
dispose()
`)
})

test('401のrecent_sign_in_requiredは有効期限切れの文言を出し、通知しないこと', async () => {
  await runUsernameChangeTest(`
// Given: 再認証の有効期限切れで401を返す変更API
const { change, calls, dispose } = setup({
  updateUsername: async () => {
    calls.push('update')
    throw codedError('recent_sign_in_required', 401)
  },
})
change.setUsername('bob12')

// When: 送信する
await change.submit()

// Then: やり直しを促す文言を表示する
assert.equal(change.error(), COPY.recentSignInExpired)
assert.equal(change.success(), '')
assert.deepEqual(calls, ['reauthenticate', 'update'])
dispose()
`)
})

test('再認証のポップアップを閉じた場合はエラーを出さないこと', async () => {
  await runUsernameChangeTest(`
// Given: ポップアップを閉じて中断する再認証
const { change, dispose } = setup({
  reauthenticate: async () => {
    throw codedError('auth/popup-closed-by-user')
  },
})
change.setUsername('bob12')

// When: 送信する
await change.submit()

// Then: エラーも成功文言も出さず、入力を残す
assert.equal(change.error(), '')
assert.equal(change.success(), '')
assert.equal(change.username(), 'bob12')
assert.equal(change.submitting(), false)
dispose()
`)
})

test('変更中に重ねて送信しても再認証は1回だけ行うこと', async () => {
  await runUsernameChangeTest(`
// Given: 完了を待たせる再認証
const pending = Promise.withResolvers()
const { change, calls, dispose } = setup({
  reauthenticate: async () => {
    calls.push('reauthenticate')
    await pending.promise
    return 'reauth-token'
  },
})
change.setUsername('bob12')

// When: 変更中にもう一度送信する
const submitting = change.submit()
await change.submit()

// Then: 再認証は1回だけ
assert.deepEqual(calls, ['reauthenticate'])
assert.equal(change.submitting(), true)
pending.resolve()
await submitting
assert.equal(change.success(), COPY.success)
dispose()
`)
})

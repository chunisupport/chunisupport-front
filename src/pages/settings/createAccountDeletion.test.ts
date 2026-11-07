import test from 'node:test'
import { runSolidBrowserScript } from '../../test/runSolidBrowserScript'

/**
 * ブラウザ向けSolidの実行条件で退会Primitiveを検証する。
 *
 * 検証コードでは次の値を利用できる。
 * - `setup(overrides)`: Primitiveを生成し、`{ deletion, calls, dispose }` を返す。
 *   `calls` には退会・ログイン状態の破棄・遷移が呼ばれた順に記録される。
 * - `COPY`: 退会確認ダイアログの表示文言。
 *
 * @param script - Primitiveを操作する検証コード。
 * @returns 検証終了時に解決するPromise。
 */
const runAccountDeletionTest = (script: string): Promise<void> =>
  runSolidBrowserScript(`
import assert from 'node:assert/strict'
import { createRoot } from 'solid-js'
import { createAccountDeletion } from './src/pages/settings/createAccountDeletion.ts'
import { ACCOUNT_DELETE_COPY as COPY } from './src/pages/settings/AccountSettings.constants.ts'
import { errorMessages } from './src/types/api.ts'

const codedError = (code, status) => Object.assign(new Error('raw'), { code, status })
const setup = (overrides = {}) => {
  const calls = []
  return createRoot((dispose) => {
    const deletion = createAccountDeletion({
      deleteAccount: async () => {
        calls.push('deleteAccount')
      },
      discardSession: async () => {
        calls.push('discardSession')
      },
      navigateToLogin: () => calls.push('navigateToLogin'),
      ...overrides,
    })
    return { deletion, calls, dispose }
  })
}
${script}
`)

test('退会成功時は端末内のログイン状態を破棄してからログイン画面へ遷移すること', async () => {
  await runAccountDeletionTest(`
// Given: 退会確認ダイアログを開いた状態
const { deletion, calls, dispose } = setup()
deletion.setDialogOpen(true)

// When: 確定する
await deletion.submit()

// Then: 退会、ログイン状態の破棄、遷移の順に行い、エラーは出さない
assert.deepEqual(calls, ['deleteAccount', 'discardSession', 'navigateToLogin'])
assert.equal(deletion.error(), '')
assert.equal(deletion.deleting(), false)
dispose()
`)
})

test('ログイン状態の破棄を終えるまで処理中の表示を保つこと', async () => {
  await runAccountDeletionTest(`
// Given: 完了を待たせるログイン状態の破棄
const pending = Promise.withResolvers()
const { deletion, calls, dispose } = setup({
  discardSession: async () => {
    calls.push('discardSession')
    await pending.promise
  },
})

// When: 確定してログイン状態の破棄中に状態を見る
const deleting = deletion.submit()
await new Promise((resolve) => setImmediate(resolve))

// Then: 遷移前は処理中のまま
assert.equal(deletion.deleting(), true)
assert.deepEqual(calls, ['deleteAccount', 'discardSession'])
pending.resolve()
await deleting
assert.deepEqual(calls, ['deleteAccount', 'discardSession', 'navigateToLogin'])
dispose()
`)
})

test('再認証で別アカウントが選ばれた場合はダイアログ内に文言を出し、遷移しないこと', async () => {
  await runAccountDeletionTest(`
// Given: 再認証でauth/user-mismatchになる退会
const { deletion, calls, dispose } = setup({
  deleteAccount: async () => {
    throw codedError('auth/user-mismatch')
  },
})
deletion.setDialogOpen(true)

// When: 確定する
await deletion.submit()

// Then: ダイアログを開いたままエラーを表示し、サインアウトも遷移もしない
assert.equal(deletion.error(), COPY.userMismatch)
assert.equal(deletion.dialogOpen(), true)
assert.deepEqual(calls, [])
assert.equal(deletion.deleting(), false)
dispose()
`)
})

test('401のrecent_sign_in_requiredは有効期限切れの文言をダイアログ内に出すこと', async () => {
  await runAccountDeletionTest(`
// Given: 再認証の有効期限切れで401を返す退会API
const { deletion, calls, dispose } = setup({
  deleteAccount: async () => {
    throw codedError('recent_sign_in_required', 401)
  },
})
deletion.setDialogOpen(true)

// When: 確定する
await deletion.submit()

// Then: やり直しを促す文言を表示し、遷移しない
assert.equal(deletion.error(), COPY.recentSignInExpired)
assert.deepEqual(calls, [])
dispose()
`)
})

test('その他の失敗は対応する文言を出し、ダイアログを閉じるとエラーを消すこと', async () => {
  await runAccountDeletionTest(`
// Given: 403を返す退会API
const { deletion, dispose } = setup({
  deleteAccount: async () => {
    throw codedError(undefined, 403)
  },
})
deletion.setDialogOpen(true)
await deletion.submit()
assert.equal(deletion.error(), errorMessages.forbidden)

// When: ダイアログを閉じる
deletion.setDialogOpen(false)

// Then: エラーを持ち越さない
assert.equal(deletion.dialogOpen(), false)
assert.equal(deletion.error(), '')
dispose()
`)
})

test('再認証のポップアップを閉じた場合はエラーを出さないこと', async () => {
  await runAccountDeletionTest(`
// Given: 再認証ポップアップを閉じて中断する退会
const { deletion, calls, dispose } = setup({
  deleteAccount: async () => {
    throw codedError('auth/popup-closed-by-user')
  },
})
deletion.setDialogOpen(true)

// When: 確定する
await deletion.submit()

// Then: エラーを表示せず、再び確定できる状態に戻る
assert.equal(deletion.error(), '')
assert.equal(deletion.deleting(), false)
assert.deepEqual(calls, [])
dispose()
`)
})

test('処理中に重ねて確定しても1回だけ退会処理を行うこと', async () => {
  await runAccountDeletionTest(`
// Given: 完了を待たせる退会API
const pending = Promise.withResolvers()
const { deletion, calls, dispose } = setup({
  deleteAccount: async () => {
    calls.push('deleteAccount')
    await pending.promise
  },
})

// When: 処理中にもう一度確定する
const deleting = deletion.submit()
await deletion.submit()

// Then: 2回目は呼ばない
assert.deepEqual(calls, ['deleteAccount'])
assert.equal(deletion.deleting(), true)
pending.resolve()
await deleting
assert.deepEqual(calls, ['deleteAccount', 'discardSession', 'navigateToLogin'])
dispose()
`)
})

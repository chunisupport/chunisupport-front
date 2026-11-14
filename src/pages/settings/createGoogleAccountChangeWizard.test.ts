import test from 'node:test'
import { runSolidBrowserScript } from '../../test/runSolidBrowserScript'

/**
 * ブラウザ向けSolidの実行条件でGoogleアカウント変更ウィザードPrimitiveを検証する。
 *
 * 検証コードでは次の値を利用できる。
 * - `setup(overrides)`: 現在のメールアドレスを `old@example.com` とし、変更先に `new@example.com` が選ばれる
 *   Primitiveを生成して `{ wizard, calls, dispose }` を返す。
 *   `calls` には選択・取り消し・変更・セッション喪失時の処理が呼ばれた順に記録される。
 * - `selectTarget(wizard)`: ウィザードを開いて変更先を選び、本人確認ダイアログを開く。
 * - `codedError(code, status)`: コード付きのエラーを作成する。
 * - `COPY`: Googleアカウント変更欄の表示文言。
 *
 * @param script - Primitiveを操作する検証コード。
 * @returns 検証終了時に解決するPromise。
 */
const runWizardTest = (script: string): Promise<void> =>
  runSolidBrowserScript(`
import assert from 'node:assert/strict'
import { createRoot } from 'solid-js'
import { createGoogleAccountChangeWizard } from './src/pages/settings/createGoogleAccountChangeWizard.ts'
import { GOOGLE_ACCOUNT_CHANGE_COPY as COPY } from './src/pages/settings/AccountSettings.constants.ts'
import { errorMessages } from './src/types/api.ts'

const codedError = (code, status) => Object.assign(new Error('raw'), { code, status })
const newTarget = { email: 'new@example.com', credential: null }
const setup = (overrides = {}) => {
  const calls = []
  let email = 'old@example.com'
  return createRoot((dispose) => {
    const wizard = createGoogleAccountChangeWizard({
      getCurrentEmail: () => email,
      selectTarget: async () => {
        calls.push('select')
        return newTarget
      },
      cancelChange: async () => {
        calls.push('cancel')
      },
      changeAccount: async (target) => {
        calls.push(['change', target])
        email = target.email
        return true
      },
      onSessionLost: async () => {
        calls.push('sessionLost')
      },
      ...overrides,
    })
    return { wizard, calls, dispose }
  })
}
const selectTarget = async (wizard) => {
  wizard.setOpen(true)
  await wizard.select()
  wizard.proceed()
}
${script}
`)

for (const credential of [
  null,
  { providerId: 'google.com', signInMethod: 'google.com', idToken: 'selected-token' },
]) {
  test(`認証情報が${credential === null ? 'null' : '非null'}の変更先を選ぶと確認へ進み、対象全体を渡して変更し、完了して現在のメールアドレスを更新すること`, async () => {
    await runWizardTest(`
// Given: ウィザードを開いた状態
const selectedTarget = { email: 'new@example.com', credential: ${JSON.stringify(credential)} }
const { wizard, calls, dispose } = setup({ selectTarget: async () => {
  calls.push('select')
  return selectedTarget
} })
wizard.setOpen(true)
assert.equal(wizard.step(), 'select')

// When: 変更先を選び、本人確認を確定する
await wizard.select()
assert.equal(wizard.step(), 'confirm')
assert.equal(wizard.target().email, 'new@example.com')
wizard.proceed()
assert.equal(wizard.isReauthOpen(), true)
await wizard.submit()

// Then: 完了ステップで変更先のメールアドレスを表示し、使用済みの認証情報を保持しない
assert.deepEqual(calls, ['select', ['change', selectedTarget]])
assert.equal(calls[1][1], selectedTarget)
assert.equal(wizard.step(), 'done')
assert.equal(wizard.isReauthOpen(), false)
assert.equal(wizard.currentEmail(), 'new@example.com')
assert.equal(wizard.target(), undefined)
assert.equal(wizard.isSubmitting(), false)
dispose()
`)
  })
}

test('変更後にセッションを切り替えられなかった場合はセッション喪失時の処理を行うこと', async () => {
  await runWizardTest(`
// Given: 差し替え後にログイン中のセッションを切り替えられない変更
const { wizard, calls, dispose } = setup({
  changeAccount: async (target) => {
    calls.push(['change', target.email])
    return false
  },
})
await selectTarget(wizard)

// When: 本人確認を確定する
await wizard.submit()

// Then: 完了扱いにせず、ログインし直すための処理を行う
assert.deepEqual(calls, ['select', ['change', 'new@example.com'], 'sessionLost'])
assert.notEqual(wizard.step(), 'done')
assert.equal(wizard.reauthError(), '')
dispose()
`)
})

for (const { code, status } of [
  { code: 'auth/user-mismatch', status: undefined },
  { code: 'invalid_credentials', status: 401 },
]) {
  test(`${code}で本人確認に失敗した場合は本人確認ダイアログに現在のメールアドレスを示すこと`, async () => {
    await runWizardTest(`
// Given: 選択したエラーコードで失敗する変更
const error = codedError('${code}', ${status})
const { wizard, calls, dispose } = setup({
  changeAccount: async () => {
    throw error
  },
})
await selectTarget(wizard)

// When: 本人確認を確定する
await wizard.submit()

// Then: 本人確認ダイアログを開いたまま、選ぶべきアカウントを示す
assert.equal(wizard.reauthError(), COPY.userMismatch('old@example.com'))
assert.ok(wizard.reauthError().includes('old@example.com'))
assert.equal(wizard.error(), '')
assert.equal(wizard.isReauthOpen(), true)
assert.equal(wizard.target().email, 'new@example.com')
assert.equal(calls.includes('cancel'), false)
dispose()
`)
  })
}

test('401のrecent_sign_in_requiredは本人確認を閉じてウィザード本体で変更先を選び直させること', async () => {
  await runWizardTest(`
// Given: 有効期限切れで失敗する変更
const { wizard, calls, dispose } = setup({
  changeAccount: async () => {
    throw codedError('recent_sign_in_required', 401)
  },
})
await selectTarget(wizard)

// When: 本人確認を確定する
await wizard.submit()

// Then: 本人確認を閉じて選択ステップへ戻し、変更先のサインイン状態を破棄する
assert.equal(wizard.isReauthOpen(), false)
assert.equal(wizard.step(), 'select')
assert.equal(wizard.error(), COPY.recentSignInExpired)
assert.equal(wizard.reauthError(), '')
assert.equal(calls.at(-1), 'cancel')
dispose()
`)
})

test('変更できないアカウントだった場合はウィザード本体にAPIの文言を出すこと', async () => {
  await runWizardTest(`
// Given: 変更先がすでに別ユーザーに連携済みで失敗する変更
const { wizard, dispose } = setup({
  changeAccount: async () => {
    throw codedError('firebase_uid_already_linked', 409)
  },
})
await selectTarget(wizard)

// When: 本人確認を確定する
await wizard.submit()

// Then: ウィザード本体にエラーを表示する
assert.equal(wizard.error(), errorMessages.firebase_uid_already_linked)
assert.equal(wizard.step(), 'select')
dispose()
`)
})

test('その他の失敗は本人確認ダイアログに出し、ポップアップを閉じた場合は何も出さないこと', async () => {
  await runWizardTest(`
// Given: 403、続いてポップアップを閉じて失敗する変更
const errors = [codedError(undefined, 403), codedError('auth/popup-closed-by-user')]
const { wizard, dispose } = setup({
  changeAccount: async () => {
    throw errors.shift()
  },
})
await selectTarget(wizard)

// When: 403で失敗する
await wizard.submit()

// Then: 本人確認ダイアログに表示する
assert.equal(wizard.reauthError(), errorMessages.forbidden)

// When: ポップアップを閉じて中断する
await wizard.submit()

// Then: エラーを消し、確認ステップに留まる
assert.equal(wizard.reauthError(), '')
assert.equal(wizard.error(), '')
assert.equal(wizard.step(), 'confirm')
dispose()
`)
})

test('変更先の選択に失敗した場合は選択を取り消し、ポップアップを閉じた場合は選択済みの変更先を残すこと', async () => {
  await runWizardTest(`
// Given: 1回目は成功、2回目はポップアップを閉じ、3回目は同じアカウントで失敗する選択
const results = [
  async () => newTarget,
  async () => {
    throw codedError('auth/popup-closed-by-user')
  },
  async () => {
    throw codedError('firebase_account_unchanged')
  },
]
const { wizard, calls, dispose } = setup({
  selectTarget: () => results.shift()(),
})
wizard.setOpen(true)
await wizard.select()

// When: 選び直しのポップアップを閉じる
await wizard.select()

// Then: 選択済みの変更先を残す
assert.equal(wizard.target().email, 'new@example.com')
assert.equal(wizard.error(), '')

// When: 変更できないアカウントを選ぶ
await wizard.select()

// Then: 変更先を空欄へ戻してエラーを出し、変更先のサインイン状態を破棄する
assert.equal(wizard.target(), undefined)
assert.equal(wizard.error(), errorMessages.firebase_account_unchanged)
assert.deepEqual(calls, ['cancel'])
dispose()
`)
})

test('変更中は重ねて変更せず、本人確認ダイアログもウィザードも閉じさせないこと', async () => {
  await runWizardTest(`
// Given: 完了を待たせる変更
const pending = Promise.withResolvers()
const { wizard, calls, dispose } = setup({
  changeAccount: async (target) => {
    calls.push(['change', target.email])
    await pending.promise
    return true
  },
})
await selectTarget(wizard)

// When: 変更中にもう一度確定し、ダイアログを閉じようとする
const submitting = wizard.submit()
await wizard.submit()
wizard.setReauthOpen(false)
wizard.setOpen(false)

// Then: 1回だけ変更し、どちらのダイアログも開いたまま
assert.deepEqual(calls, ['select', ['change', 'new@example.com']])
assert.equal(wizard.isBusy(), true)
assert.equal(wizard.isReauthOpen(), true)
assert.equal(wizard.isOpen(), true)
pending.resolve()
await submitting
assert.equal(wizard.step(), 'done')
dispose()
`)
})

test('ウィザードを閉じると途中の状態と変更先のサインイン状態を破棄すること', async () => {
  await runWizardTest(`
// Given: 変更先を選び、本人確認を開いた状態
const { wizard, calls, dispose } = setup()
await selectTarget(wizard)

// When: ウィザードを閉じる
wizard.setOpen(false)

// Then: 選択ステップへ戻し、変更先のサインイン状態を破棄する
assert.equal(wizard.isOpen(), false)
assert.equal(wizard.isReauthOpen(), false)
assert.equal(wizard.step(), 'select')
assert.deepEqual(calls, ['select', 'cancel'])
assert.equal(wizard.target(), undefined)
dispose()
`)
})

test('ウィザードを開いたまま画面から取り除くと変更先のサインイン状態を破棄すること', async () => {
  await runWizardTest(`
// Given: 変更先を選び、ウィザードを開いたままの状態
const { wizard, calls, dispose } = setup()
await selectTarget(wizard)

// When: 画面から取り除く
dispose()

// Then: 変更先のサインイン状態を破棄する
assert.deepEqual(calls, ['select', 'cancel'])
`)
})

test('本人確認ダイアログは再認証中でなければ閉じられること', async () => {
  await runWizardTest(`
// Given: 本人確認を開いた状態
const { wizard, dispose } = setup()
await selectTarget(wizard)
assert.equal(wizard.isReauthOpen(), true)

// When: 再認証中ではないまま閉じる
wizard.setReauthOpen(false)

// Then: 閉じる
assert.equal(wizard.isReauthOpen(), false)
assert.equal(wizard.isSubmitting(), false)
dispose()
`)
})

test('現在のメールアドレスを取得できない場合は変更先のメールアドレスで完了すること', async () => {
  await runWizardTest(`
// Given: 変更成功後に現在のメールアドレスが空で返る状態
let current = 'old@example.com'
const { wizard, dispose } = setup({
  getCurrentEmail: () => current,
  changeAccount: async () => {
    current = ''
    return true
  },
})
await selectTarget(wizard)

// When: 本人確認を確定する
await wizard.submit()

// Then: 変更先のメールアドレスで完了する
assert.equal(wizard.currentEmail(), 'new@example.com')
assert.equal(wizard.step(), 'done')
dispose()
`)
})

test('本人確認と無関係な文字列コードの失敗は本人確認ダイアログにAPIの文言を出すこと', async () => {
  await runWizardTest(`
// Given: 本人確認の対象外コードで失敗する変更
const { wizard, dispose } = setup({
  changeAccount: async () => {
    throw codedError('auth/invalid-credential')
  },
})
await selectTarget(wizard)

// When: 本人確認を確定する
await wizard.submit()

// Then: 本人確認ダイアログにAPIの文言を出す
assert.equal(wizard.reauthError(), '認証情報が無効です。もう一度ログインしてください。')
assert.equal(wizard.isReauthOpen(), true)
dispose()
`)
})

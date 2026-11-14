import test from 'node:test'
import { runSolidBrowserScript } from '../../test/runSolidBrowserScript'

/**
 * ブラウザ向けSolidの実行条件でプロフィール非公開設定Primitiveを検証する。
 *
 * 検証コードでは次の値を利用できる。
 * - `setup(overrides)`: 取得済みの値をfalseとしてPrimitiveを生成し、`{ setting, calls, setSource, dispose }` を返す。
 *   `calls` には `update` / `refresh` / `saved` の呼び出し引数が記録される。
 * - `COPY`: 非公開設定欄の表示文言。
 * - `settle()`: 保留中のPromiseを処理し終えるまで待つ。
 *
 * @param script - Primitiveを操作する検証コード。
 * @returns 検証終了時に解決するPromise。
 */
const runPrivacySettingTest = (script: string): Promise<void> =>
  runSolidBrowserScript(`
import assert from 'node:assert/strict'
import { createRoot, createSignal } from 'solid-js'
import { createPrivacySetting } from './src/pages/settings/createPrivacySetting.ts'
import { PRIVACY_SETTINGS_COPY as COPY } from './src/pages/settings/ProfileSettings.constants.ts'
import { errorMessages } from './src/types/api.ts'

const settle = () => new Promise((resolve) => setImmediate(resolve))
const setup = (overrides = {}) => {
  const calls = { update: [], refresh: 0, saved: [] }
  return createRoot((dispose) => {
    const [source, setSource] = createSignal(false)
    const setting = createPrivacySetting({
      source,
      update: async (isPrivate) => {
        calls.update.push(isPrivate)
        return { is_private: isPrivate }
      },
      refresh: async () => {
        calls.refresh++
        return { is_private: false }
      },
      onSaved: (isPrivate) => calls.saved.push(isPrivate),
      ...overrides,
    })
    return { setting, calls, setSource, dispose }
  })
}
${script}
`)

test('取得済みの非公開状態を表示し、取得し直した値に追従すること', async () => {
  await runPrivacySettingTest(`
// Given: 取得済みの値が公開の設定
const { setting, setSource, dispose } = setup()
assert.equal(setting.value(), false)

// When: 設定画面のデータを取得し直して非公開になる
setSource(true)

// Then: 表示も非公開になる
assert.equal(setting.value(), true)
dispose()
`)
})

test('保存成功時はAPIの結果を表示と取得済みデータへ反映し、成功文言を出すこと', async () => {
  await runPrivacySettingTest(`
// Given: 要求した非公開とは異なる公開状態を返すAPI
const { setting, calls, dispose } = setup({
  update: async (isPrivate) => {
    calls.update.push(isPrivate)
    return { is_private: false }
  },
})

// When: 非公開へ切り替える
await setting.toggle(true)

// Then: 保存した値を反映し、成功文言を表示する
assert.deepEqual(calls.update, [true])
assert.deepEqual(calls.saved, [false])
assert.equal(setting.value(), false)
assert.equal(setting.success(), COPY.success)
assert.equal(setting.error(), '')
assert.equal(setting.submitting(), false)
dispose()
`)
})

test('保存中は切り替え後の値を表示し、二重に保存しないこと', async () => {
  await runPrivacySettingTest(`
// Given: 完了を待たせる保存API
const pending = Promise.withResolvers()
const { setting, calls, dispose } = setup({
  update: async (isPrivate) => {
    calls.update.push(isPrivate)
    await pending.promise
    return { is_private: isPrivate }
  },
})

// When: 保存中にもう一度切り替える
const saving = setting.toggle(true)
await setting.toggle(false)

// Then: 2回目は保存せず、保存中の表示を保つ
assert.deepEqual(calls.update, [true])
assert.equal(setting.value(), true)
assert.equal(setting.submitting(), true)
pending.resolve()
await saving
assert.equal(setting.submitting(), false)
assert.equal(setting.success(), COPY.success)
dispose()
`)
})

test('401で保存に失敗した場合は表示を戻し、認証エラーの文言を出してサーバーの状態に合わせること', async () => {
  await runPrivacySettingTest(`
// Given: 401を返す保存APIと、非公開の再取得を保留するAPI
const pending = Promise.withResolvers()
const { setting, calls, dispose } = setup({
  update: async () => {
    throw Object.assign(new Error('raw'), { status: 401, code: 'unauthorized' })
  },
  refresh: async () => {
    calls.refresh++
    await pending.promise
    return { is_private: true }
  },
})

// When: 非公開へ切り替え、再取得の完了前まで待つ
const saving = setting.toggle(true)
await settle()

// Then: 楽観値を直前の公開状態へ戻し、認証エラーを表示する
assert.equal(setting.value(), false)
assert.equal(setting.submitting(), true)
assert.equal(setting.error(), errorMessages.unauthorized)

// When: サーバーの再取得が完了する
pending.resolve()
await saving

// Then: 認証エラーを表示し、サーバーの最新状態を表示する
assert.equal(setting.error(), errorMessages.unauthorized)
assert.equal(setting.success(), '')
assert.equal(calls.refresh, 1)
assert.deepEqual(calls.saved, [])
assert.equal(setting.value(), true)
assert.equal(setting.submitting(), false)
dispose()
`)
})

test('保存と再取得の両方に失敗した場合は直前の状態へ戻して失敗文言を出すこと', async () => {
  await runPrivacySettingTest(`
// Given: 保存も再取得も失敗するAPI
const { setting, dispose } = setup({
  update: async () => {
    throw new Error('network')
  },
  refresh: async () => {
    throw new Error('network')
  },
})

// When: 非公開へ切り替える
await setting.toggle(true)
await settle()

// Then: 直前の公開状態へ戻し、失敗文言を表示する
assert.equal(setting.value(), false)
assert.equal(setting.error(), COPY.failure)
assert.equal(setting.submitting(), false)
dispose()
`)
})

test('次の保存を開始すると前回の成功文言を消すこと', async () => {
  await runPrivacySettingTest(`
// Given: 非公開への保存に成功した設定
const pending = Promise.withResolvers()
const { setting, calls, dispose } = setup({
  update: async (isPrivate) => {
    calls.update.push(isPrivate)
    if (calls.update.length === 2) await pending.promise
    return { is_private: isPrivate }
  },
})
await setting.toggle(true)
assert.equal(setting.value(), true)
assert.deepEqual(calls.saved, [true])
assert.equal(setting.success(), COPY.success)

// When: 次の保存を開始し、完了を保留する
const saving = setting.toggle(false)

// Then: 保存の完了を待たずに成功文言を消す
assert.equal(setting.submitting(), true)
assert.equal(setting.success(), '')
assert.equal(setting.error(), '')
pending.resolve()
await saving
dispose()
`)
})

test('次の保存を開始すると前回の失敗文言を消し、成功時は成功文言を出すこと', async () => {
  await runPrivacySettingTest(`
// Given: 1回目は失敗し、2回目は成功するAPI
let fail = true
const pending = Promise.withResolvers()
const { setting, dispose } = setup({
  update: async (isPrivate) => {
    if (fail) throw new Error('network')
    await pending.promise
    return { is_private: isPrivate }
  },
})
await setting.toggle(true)
assert.equal(setting.error(), COPY.failure)

// When: もう一度切り替えて成功する
fail = false
const saving = setting.toggle(true)

// Then: 完了前に失敗文言を消す
assert.equal(setting.submitting(), true)
assert.equal(setting.error(), '')
assert.equal(setting.success(), '')

// When: 保存が成功する
pending.resolve()
await saving

// Then: 失敗文言を消して成功文言だけを表示する
assert.equal(setting.error(), '')
assert.equal(setting.success(), COPY.success)
dispose()
`)
})

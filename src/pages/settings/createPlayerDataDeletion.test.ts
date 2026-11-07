import test from 'node:test'
import { runSolidBrowserScript } from '../../test/runSolidBrowserScript'

/**
 * ブラウザ向けSolidの実行条件でプレイヤーデータ削除Primitiveを検証する。
 *
 * 検証コードでは次の値を利用できる。
 * - `setup(overrides)`: ユーザーネームを `alice` としてPrimitiveを生成し、`{ deletion, calls, dispose }` を返す。
 *   `calls` には `delete` / `deleted` の呼び出し回数が記録される。
 * - `COPY`: プレイヤーデータ削除の表示文言。
 *
 * @param script - Primitiveを操作する検証コード。
 * @returns 検証終了時に解決するPromise。
 */
const runPlayerDataDeletionTest = (script: string): Promise<void> =>
  runSolidBrowserScript(`
import assert from 'node:assert/strict'
import { createRoot } from 'solid-js'
import { createPlayerDataDeletion } from './src/pages/settings/createPlayerDataDeletion.ts'
import { PLAYER_DATA_DELETE_COPY as COPY } from './src/pages/settings/PlayerDataSettings.constants.ts'
import { errorMessages } from './src/types/api.ts'

const setup = (overrides = {}) => {
  const calls = { delete: 0, deleted: 0 }
  return createRoot((dispose) => {
    const deletion = createPlayerDataDeletion({
      username: () => 'alice',
      deletePlayerData: async () => {
        calls.delete++
      },
      onDeleted: async () => {
        calls.deleted++
      },
      ...overrides,
    })
    return { deletion, calls, dispose }
  })
}
${script}
`)

test('確認入力がユーザーネームと一致するまで削除しないこと', async () => {
  await runPlayerDataDeletionTest(`
// Given: 確認ダイアログを開いた状態
const { deletion, calls, dispose } = setup()
deletion.openDialog()
assert.equal(deletion.dialogOpen(), true)

// When: 一致しない入力のまま確定する
deletion.setConfirmInput('alic')
await deletion.submit()

// Then: 削除せずダイアログも開いたまま
assert.equal(deletion.isConfirmed(), false)
assert.equal(calls.delete, 0)
assert.equal(deletion.dialogOpen(), true)

// When: 一致する入力にする
deletion.setConfirmInput('alice')

// Then: 確定できる
assert.equal(deletion.isConfirmed(), true)
dispose()
`)
})

test('ユーザーネームを取得できていない場合は空入力でも確定できないこと', async () => {
  await runPlayerDataDeletionTest(`
// Given: ユーザーネーム未取得の状態
const { deletion, calls, dispose } = setup({ username: () => undefined })
deletion.openDialog()

// When: 空入力のまま確定する
await deletion.submit()

// Then: 削除しない
assert.equal(deletion.isConfirmed(), false)
assert.equal(calls.delete, 0)
dispose()
`)
})

test('ダイアログを閉じるとエラーを消し、開き直すと確認入力を空にすること', async () => {
  await runPlayerDataDeletionTest(`
// Given: 失敗した後の確認ダイアログ
const { deletion, dispose } = setup({
  deletePlayerData: async () => {
    throw new Error('network')
  },
})
deletion.openDialog()
deletion.setConfirmInput('alice')
await deletion.submit()
assert.equal(deletion.error(), COPY.failure)

// When: 閉じる
deletion.setDialogOpen(false)

// Then: エラーを持ち越さない
assert.equal(deletion.dialogOpen(), false)
assert.equal(deletion.error(), '')

// When: 開き直す
deletion.openDialog()

// Then: 確認入力が空になる
assert.equal(deletion.confirmInput(), '')
dispose()
`)
})

test('削除成功時はダイアログを閉じて成功文言を出し、表示を取得し直すこと', async () => {
  await runPlayerDataDeletionTest(`
// Given: 確認入力が一致したダイアログ
const { deletion, calls, dispose } = setup()
deletion.openDialog()
deletion.setConfirmInput('alice')

// When: 確定する
await deletion.submit()

// Then: 削除後に再取得し、ダイアログを閉じて成功文言を表示する
assert.equal(calls.delete, 1)
assert.equal(calls.deleted, 1)
assert.equal(deletion.dialogOpen(), false)
assert.equal(deletion.success(), COPY.success)
assert.equal(deletion.error(), '')
assert.equal(deletion.deleting(), false)
dispose()
`)
})

test('削除後の再取得に失敗しても削除成功として扱うこと', async () => {
  await runPlayerDataDeletionTest(`
// Given: 再取得が失敗する設定
const { deletion, dispose } = setup({
  onDeleted: async () => {
    throw new Error('network')
  },
})
deletion.openDialog()
deletion.setConfirmInput('alice')

// When: 確定する
await deletion.submit()

// Then: 成功文言のままでエラーは出さない
assert.equal(deletion.success(), COPY.success)
assert.equal(deletion.error(), '')
dispose()
`)
})

test('削除に失敗した場合はダイアログを開いたまま失敗文言を出し、再取得しないこと', async () => {
  await runPlayerDataDeletionTest(`
// Given: 401を返す削除API
const { deletion, calls, dispose } = setup({
  deletePlayerData: async () => {
    calls.delete++
    throw Object.assign(new Error('raw'), { status: 401, code: 'token_expired' })
  },
})
deletion.openDialog()
deletion.setConfirmInput('alice')

// When: 確定する
await deletion.submit()

// Then: ダイアログ内に認証エラーを表示し、入力を残して再試行できる
assert.equal(deletion.error(), errorMessages.token_expired)
assert.equal(deletion.success(), '')
assert.equal(deletion.dialogOpen(), true)
assert.equal(deletion.confirmInput(), 'alice')
assert.equal(deletion.deleting(), false)
assert.equal(calls.deleted, 0)
dispose()
`)
})

test('削除中に重ねて確定しても1回だけ削除すること', async () => {
  await runPlayerDataDeletionTest(`
// Given: 完了を待たせる削除API
const pending = Promise.withResolvers()
const { deletion, calls, dispose } = setup({
  deletePlayerData: async () => {
    calls.delete++
    await pending.promise
  },
})
deletion.openDialog()
deletion.setConfirmInput('alice')

// When: 削除中にもう一度確定する
const deleting = deletion.submit()
await deletion.submit()

// Then: 2回目は削除せず、削除中の表示を保つ
assert.equal(calls.delete, 1)
assert.equal(deletion.deleting(), true)
pending.resolve()
await deleting
assert.equal(deletion.deleting(), false)
assert.equal(deletion.success(), COPY.success)
dispose()
`)
})

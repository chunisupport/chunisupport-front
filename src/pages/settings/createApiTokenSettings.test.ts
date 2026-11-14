import test from 'node:test'
import { runSolidBrowserScript } from '../../test/runSolidBrowserScript'

/**
 * ブラウザ向けSolidの実行条件でAPIトークン設定Primitiveを検証する。
 *
 * 検証コードでは次の値を利用できる。
 * - `setup(overrides)`: ID 1・2 のAPIトークンを持つ `alice`（PLAYER）としてPrimitiveを生成し、
 *   一覧の取得を待ってから `{ settings, calls, dispose }` を返す。
 *   `calls` には `fetch` の回数と `issue` / `rename` / `delete` の引数が記録される。
 * - `token(id, name)`: APIトークン管理情報を作成する。
 * - `names(settings)`: 一覧のAPIトークン名を並べた配列を返す。
 * - `codedError(code, status)`: コード付きのAPIエラーを作成する。
 * - `COPY`: APIトークン設定欄の表示文言。
 *
 * @param script - Primitiveを操作する検証コード。
 * @returns 検証終了時に解決するPromise。
 */
const runApiTokenSettingsTest = (script: string): Promise<void> =>
  runSolidBrowserScript(`
import assert from 'node:assert/strict'
import { createRoot } from 'solid-js'
import { createApiTokenSettings } from './src/pages/settings/createApiTokenSettings.ts'
import { API_TOKEN_SETTINGS_COPY as COPY } from './src/pages/settings/ApiTokenSettings.constants.ts'
import { errorMessages } from './src/types/api.ts'

const settle = () => new Promise((resolve) => setImmediate(resolve))
const codedError = (code, status) => Object.assign(new Error('raw'), { code, status })
const token = (id, name, permission = 'read') => ({
  id,
  name,
  permission,
  token_prefix: 'prefix' + id,
  last_used_at: null,
  created_at: '2026-11-01T00:00:00+09:00',
})
const names = (settings) => settings.tokens().tokens.map((item) => item.name)
const setup = async (overrides = {}) => {
  const calls = { fetch: 0, issue: [], rename: [], delete: [] }
  const view = createRoot((dispose) => {
    const settings = createApiTokenSettings({
      username: () => 'alice',
      accountType: () => 'PLAYER',
      fetchTokens: async () => {
        calls.fetch++
        return { tokens: [token(1, 'Bot'), token(2, 'CLI')] }
      },
      issueToken: async (request) => {
        calls.issue.push(request)
        return { ...token(3, request.name, request.permission), token: 'plain-text-token' }
      },
      renameToken: async (id, request) => {
        calls.rename.push([id, request])
        return token(id, request.name)
      },
      deleteToken: async (id) => {
        calls.delete.push(id)
      },
      ...overrides,
    })
    return { settings, calls, dispose }
  })
  await settle()
  return view
}
${script}
`)

test('別トークンの名前変更中は削除を実行せず、完了後は削除できること', async () => {
  await runApiTokenSettingsTest(`
// Given: ID 1の名前変更を保留し、ID 2の削除を準備する。
const pending = Promise.withResolvers()
const { settings, calls, dispose } = await setup({
  renameToken: async (id, request) => {
    calls.rename.push([id, request])
    await pending.promise
    return token(id, request.name)
  },
})
settings.startRenaming(settings.tokens().tokens[0])
settings.setEditingName('Renamed')
const renaming = settings.rename(1)
settings.openDeleteDialog(settings.tokens().tokens[1])

// When: 名前変更が終わる前に別の行の削除を確定する。
await settings.confirmDelete()

// Then: 操作中のIDと一覧を保ち、削除APIを呼ばない。
assert.deepEqual(calls.delete, [])
assert.equal(settings.mutatingTokenId(), 1)
assert.deepEqual(names(settings), ['Bot', 'CLI'])
pending.resolve()
await renaming

// When & Then: 名前変更完了後は削除できる。
await settings.confirmDelete()
assert.deepEqual(calls.delete, [2])
assert.deepEqual(names(settings), ['Renamed'])
dispose()
`)
})

test('別トークンの削除中は名前変更を実行せず、完了後は変更できること', async () => {
  await runApiTokenSettingsTest(`
// Given: ID 2を編集中にID 1の削除を保留する。
const pending = Promise.withResolvers()
const { settings, calls, dispose } = await setup({
  deleteToken: async (id) => {
    calls.delete.push(id)
    await pending.promise
  },
})
settings.startRenaming(settings.tokens().tokens[1])
settings.setEditingName('Terminal')
settings.openDeleteDialog(settings.tokens().tokens[0])
const deleting = settings.confirmDelete()

// When: 削除が終わる前に別の行の名前変更を保存する。
await settings.rename(2)

// Then: 名前変更APIを呼ばず、操作中のIDと入力を保つ。
assert.deepEqual(calls.rename, [])
assert.equal(settings.mutatingTokenId(), 1)
assert.equal(settings.editingName(), 'Terminal')
pending.resolve()
await deleting

// When & Then: 削除完了後は名前変更できる。
await settings.rename(2)
assert.deepEqual(calls.rename, [[2, { name: 'Terminal' }]])
assert.deepEqual(names(settings), ['Terminal'])
dispose()
`)
})

test('発行成功時は平文トークンを保持し、管理情報を一覧の先頭へ追加すること', async () => {
  await runApiTokenSettingsTest(`
// Given: 2件のAPIトークンを取得済みで、発行ダイアログを開いた状態
const { settings, calls, dispose } = await setup()
assert.equal(calls.fetch, 1)
settings.setIssueFormOpen(true)
settings.setIssueName('  Discord Bot  ')

// When: 発行する
await settings.issue()

// Then: 前後空白を除いた名前で発行し、一覧の先頭に平文を含まない管理情報を追加する
assert.deepEqual(calls.issue, [{ name: 'Discord Bot', permission: 'read' }])
assert.deepEqual(names(settings), ['Discord Bot', 'Bot', 'CLI'])
assert.equal('token' in settings.tokens().tokens[0], false)
assert.equal(settings.generatedToken().token, 'plain-text-token')
assert.equal(settings.issueSuccess(), COPY.issueSuccess)
assert.equal(settings.issueFormOpen(), false)
assert.equal(settings.issueName(), '')
assert.equal(calls.fetch, 1)
dispose()
`)
})

test('書き込み権限を発行できないアカウントは選択に関わらず読み取りで発行すること', async () => {
  await runApiTokenSettingsTest(`
// Given: PLAYERアカウントで書き込み権限が選ばれた状態
const { settings, calls, dispose } = await setup()
settings.setIssueFormOpen(true)
settings.setIssueName('Bot')
settings.setIssuePermission('read_write')

// When: 発行する
await settings.issue()

// Then: 読み取り権限で発行する
assert.equal(settings.canIssueReadWrite(), false)
assert.equal(calls.issue[0].permission, 'read')
dispose()
`)
})

test('名前が不正な場合は発行せず名前入力欄にエラーを出すこと', async () => {
  await runApiTokenSettingsTest(`
// Given: 空白だけの名前
const { settings, calls, dispose } = await setup()
settings.setIssueFormOpen(true)
settings.setIssueName('   ')

// When: 発行する
await settings.issue()

// Then: 入力欄のエラーを表示し、ダイアログを開いたままにする
assert.equal(calls.issue.length, 0)
assert.equal(settings.issueNameError(), COPY.nameValidationError)
assert.equal(settings.issueFormOpen(), true)

// When: 入力し直す
settings.setIssueName('Bot')

// Then: 入力欄のエラーを消す
assert.equal(settings.issueNameError(), '')
dispose()
`)
})

test('発行失敗時は名前の重複を入力欄に、401などそれ以外をダイアログに出して一覧を変えないこと', async () => {
  await runApiTokenSettingsTest(`
// Given: 名前の重複、続いて401を返す発行API
const errors = [codedError('api_token_name_conflict', 409), codedError('token_expired', 401)]
const { settings, dispose } = await setup({
  issueToken: async () => {
    throw errors.shift()
  },
})
settings.setIssueFormOpen(true)
settings.setIssueName('Bot')

// When: 名前が重複して失敗する
await settings.issue()

// Then: 名前入力欄にエラーを出す
assert.equal(settings.issueNameError(), errorMessages.api_token_name_conflict)
assert.equal(settings.issueActionError(), '')

// When: 認証エラーで失敗する
await settings.issue()

// Then: ダイアログ内にエラーを出し、入力と一覧はそのまま
assert.equal(settings.issueNameError(), '')
assert.equal(settings.issueActionError(), errorMessages.token_expired)
assert.equal(settings.issueFormOpen(), true)
assert.equal(settings.issueName(), 'Bot')
assert.equal(settings.generatedToken(), undefined)
assert.deepEqual(names(settings), ['Bot', 'CLI'])
assert.equal(settings.issuing(), false)
dispose()
`)
})

test('発行中は二重に発行せず、ダイアログも閉じさせないこと', async () => {
  await runApiTokenSettingsTest(`
// Given: 完了を待たせる発行API
const pending = Promise.withResolvers()
const { settings, calls, dispose } = await setup({
  issueToken: async (request) => {
    calls.issue.push(request)
    await pending.promise
    return { ...token(3, request.name), token: 'plain-text-token' }
  },
})
settings.setIssueFormOpen(true)
settings.setIssueName('Bot')

// When: 発行中にもう一度発行し、ダイアログを閉じようとする
const issuing = settings.issue()
await settings.issue()
settings.setIssueFormOpen(false)

// Then: 1回だけ発行し、発行中はダイアログを開いたまま
assert.equal(calls.issue.length, 1)
assert.equal(settings.issuing(), true)
assert.equal(settings.isIssueDisabled(), true)
assert.equal(settings.issueFormOpen(), true)
pending.resolve()
await issuing
assert.equal(settings.issuing(), false)
assert.equal(settings.issueFormOpen(), false)
dispose()
`)
})

test('一覧の取得前は有効な名前で直接発行してもAPIを呼ばないこと', async () => {
  await runApiTokenSettingsTest(`
// Given: 一覧の取得を保留したまま有効な名前を入力する
const pending = Promise.withResolvers()
const { settings, calls, dispose } = await setup({
  fetchTokens: async () => pending.promise,
})
settings.setIssueName('Bot')

// When: 一覧取得前に直接発行する
await settings.issue()

// Then: 発行不可のままでAPIも呼ばない
assert.equal(settings.isIssueDisabled(), true)
assert.equal(calls.issue.length, 0)
pending.resolve({ tokens: [] })
await settle()
dispose()
`)
})

test('一覧が上限の10件に到達している場合は発行できないこと', async () => {
  await runApiTokenSettingsTest(`
// Given: 取得を待たせる一覧API
const pending = Promise.withResolvers()
const { settings, calls, dispose } = await setup({
  fetchTokens: async () => {
    await pending.promise
    return { tokens: Array.from({ length: 10 }, (_, index) => token(index + 1, 'Token' + index)) }
  },
})

// Then: 取得前は発行できない
assert.equal(settings.isIssueDisabled(), true)

// When: 上限の10件を取得して発行する
pending.resolve()
await settle()
settings.setIssueName('Bot')
await settings.issue()

// Then: 発行できず、APIも呼ばない
assert.equal(settings.isIssueDisabled(), true)
assert.equal(calls.issue.length, 0)
dispose()
`)
})

test('一覧の取得に失敗した場合は例外を投げずに発行できない状態にすること', async () => {
  await runApiTokenSettingsTest(`
// Given: 401で失敗する一覧API
const { settings, calls, dispose } = await setup({
  fetchTokens: async () => {
    throw codedError('token_expired', 401)
  },
})

// When: 取得済みの一覧と発行可否を見て、発行する
settings.setIssueName('Bot')
await settings.issue()

// Then: 取得失敗を保持し、一覧は未取得として扱って発行しない
assert.equal(settings.tokens.error.code, 'token_expired')
assert.equal(settings.loadedTokens(), undefined)
assert.equal(settings.isIssueDisabled(), true)
assert.equal(calls.issue.length, 0)
dispose()
`)
})

test('名前変更成功時は一覧の該当行だけを置き換え、入力を終了すること', async () => {
  await runApiTokenSettingsTest(`
// Given: ID 2の名前変更を開始した状態
const { settings, calls, dispose } = await setup()
settings.startRenaming(settings.tokens().tokens[1])
assert.equal(settings.editingTokenId(), 2)
assert.equal(settings.editingName(), 'CLI')
settings.setEditingName(' Terminal ')

// When: 保存する
await settings.rename(2)

// Then: 前後空白を除いた名前で保存し、該当行だけを置き換える
assert.deepEqual(calls.rename, [[2, { name: 'Terminal' }]])
assert.deepEqual(names(settings), ['Bot', 'Terminal'])
assert.equal(settings.editingTokenId(), null)
assert.equal(settings.tokenActionSuccess(), COPY.renameSuccess)
assert.equal(settings.mutatingTokenId(), null)
dispose()
`)
})

test('名前変更失敗時は名前の不正を入力欄に、401などそれ以外を対象の行に出すこと', async () => {
  await runApiTokenSettingsTest(`
// Given: 名前の不正、続いて401を返す名前変更API
const errors = [codedError('invalid_api_token_name', 400), codedError('unauthorized', 401)]
const { settings, dispose } = await setup({
  renameToken: async () => {
    throw errors.shift()
  },
})
settings.startRenaming(settings.tokens().tokens[1])
settings.setEditingName('Terminal')

// When: 名前の不正で失敗する
await settings.rename(2)

// Then: 入力欄にエラーを出し、編集を続けられる
assert.equal(settings.editingNameError(), errorMessages.invalid_api_token_name)
assert.equal(settings.tokenActionErrorFor(2), '')
assert.equal(settings.editingTokenId(), 2)

// When: 認証エラーで失敗する
await settings.rename(2)

// Then: 対象の行にだけエラーを出し、一覧は変えない
assert.equal(settings.editingNameError(), '')
assert.equal(settings.tokenActionErrorFor(2), errorMessages.unauthorized)
assert.equal(settings.tokenActionErrorFor(1), '')
assert.equal(settings.editingTokenId(), 2)
assert.deepEqual(names(settings), ['Bot', 'CLI'])
dispose()
`)
})

test('名前変更中は重ねて保存しないこと', async () => {
  await runApiTokenSettingsTest(`
// Given: 完了を待たせる名前変更API
const pending = Promise.withResolvers()
const { settings, calls, dispose } = await setup({
  renameToken: async (id, request) => {
    calls.rename.push([id, request])
    await pending.promise
    return token(id, request.name)
  },
})
settings.startRenaming(settings.tokens().tokens[0])
settings.setEditingName('Renamed')

// When: 保存中にもう一度保存する
const renaming = settings.rename(1)
await settings.rename(1)

// Then: 1回だけ保存する
assert.equal(calls.rename.length, 1)
assert.equal(settings.mutatingTokenId(), 1)
pending.resolve()
await renaming
assert.deepEqual(names(settings), ['Renamed', 'CLI'])
dispose()
`)
})

test('削除成功時は一覧から取り除き、発行直後の表示と名前変更も終了すること', async () => {
  await runApiTokenSettingsTest(`
// Given: 発行直後のID 3を名前変更中の状態
const { settings, calls, dispose } = await setup()
settings.setIssueName('New')
await settings.issue()
settings.startRenaming(settings.tokens().tokens[0])

// When: ID 3を削除する
settings.openDeleteDialog(settings.tokens().tokens[0])
assert.equal(settings.deleteTarget().id, 3)
await settings.confirmDelete()

// Then: 一覧から取り除き、平文の表示と名前変更を終了してダイアログを閉じる
assert.deepEqual(calls.delete, [3])
assert.deepEqual(names(settings), ['Bot', 'CLI'])
assert.equal(settings.generatedToken(), undefined)
assert.equal(settings.editingTokenId(), null)
assert.equal(settings.deleteTarget(), null)
assert.equal(settings.tokenActionSuccess(), COPY.deleteSuccess)
dispose()
`)
})

test('削除失敗時はダイアログを閉じて対象の行にエラーを出し、一覧を変えないこと', async () => {
  await runApiTokenSettingsTest(`
// Given: 401を返す削除API
const { settings, dispose } = await setup({
  deleteToken: async () => {
    throw codedError('token_expired', 401)
  },
})
settings.openDeleteDialog(settings.tokens().tokens[0])

// When: 削除を確定する
await settings.confirmDelete()

// Then: 対象の行にだけエラーを出し、一覧はそのまま
assert.equal(settings.deleteTarget(), null)
assert.equal(settings.tokenActionErrorFor(1), errorMessages.token_expired)
assert.equal(settings.tokenActionErrorFor(2), '')
assert.equal(settings.tokenActionSuccess(), '')
assert.deepEqual(names(settings), ['Bot', 'CLI'])

// When: 別の行の削除ダイアログを開く
settings.openDeleteDialog(settings.tokens().tokens[1])

// Then: 前回のエラーを消す
assert.equal(settings.tokenActionErrorFor(1), '')
dispose()
`)
})

test('削除中は重ねて削除しないこと', async () => {
  await runApiTokenSettingsTest(`
// Given: 完了を待たせる削除API
const pending = Promise.withResolvers()
const { settings, calls, dispose } = await setup({
  deleteToken: async (id) => {
    calls.delete.push(id)
    await pending.promise
  },
})
settings.openDeleteDialog(settings.tokens().tokens[0])

// When: 削除中にもう一度確定する
const deleting = settings.confirmDelete()
await settings.confirmDelete()

// Then: 1回だけ削除し、削除中は対象を保持する
assert.deepEqual(calls.delete, [1])
assert.equal(settings.mutatingTokenId(), 1)
assert.equal(settings.deleteTarget().id, 1)
pending.resolve()
await deleting
assert.deepEqual(names(settings), ['CLI'])
dispose()
`)
})

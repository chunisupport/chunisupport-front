import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { appQueryClient } from '../lib/queryClient'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'

beforeEach(() => appQueryClient.clear())
afterEach(() => appQueryClient.clear())

for (const operation of ['create', 'rename', 'delete'] as const) {
  test(`${operation}Version は成功後にバージョン一覧と全マスタだけを無効化する`, async () => {
    // Given: セッションキャッシュと、成功する管理API。
    const queries = await loadTestModule(() => import('./masterData.ts'), {
      authenticate: true,
    })
    const mutations = await import('./versions.ts')
    const version = { id: 1, name: 'CHUNITHM', short_name: 'CH', released_at: '2026-01-01' }
    const calls = installFetchRecorder((_input, init) => {
      if (init?.method === 'DELETE') return new Response(null, { status: 204 })
      if (init?.method) return Response.json(version)
      return Response.json({ versions: [version], genres: [] })
    })
    await Promise.all([queries.fetchVersions(), queries.fetchMasterData(), queries.fetchGenres()])

    // When: 管理操作が成功した後、公開データを再取得する。
    if (operation === 'create') await mutations.createVersion(version)
    if (operation === 'rename') await mutations.renameVersion(version.id, version)
    if (operation === 'delete') await mutations.deleteVersion(version.id)
    await Promise.all([queries.fetchVersions(), queries.fetchMasterData(), queries.fetchGenres()])

    // Then: 管理API1件に加え、一覧と全マスタ2件だけが再取得される。
    assert.equal(calls.length, 6)
    assert.deepEqual(
      {
        versions: calls.filter(
          (call) => String(call.input) === 'http://localhost:3000/internal/master/versions'
        ).length,
        master: calls.filter(
          (call) => String(call.input) === 'http://localhost:3000/internal/master'
        ).length,
        genres: calls.filter(
          (call) => String(call.input) === 'http://localhost:3000/internal/master/genres'
        ).length,
      },
      { versions: 2, master: 2, genres: 1 }
    )
    assert.deepEqual(
      calls.filter((call) => call.init?.method).map((call) => call.init?.method),
      [{ create: 'POST', rename: 'PUT', delete: 'DELETE' }[operation]]
    )
  })

  test(`${operation}Version は失敗時に既存キャッシュを無効化しない`, async () => {
    // Given: セッションキャッシュと、失敗する管理API。
    const queries = await loadTestModule(() => import('./masterData.ts'), {
      authenticate: true,
    })
    const mutations = await import('./versions.ts')
    const version = { id: 1, name: 'CHUNITHM', short_name: 'CH', released_at: '2026-01-01' }
    const calls = installFetchRecorder((_input, init) => {
      if (init?.method) throw new Error('network error')
      return Response.json({ versions: [version], genres: [] })
    })
    await Promise.all([queries.fetchVersions(), queries.fetchMasterData()])

    // When: 管理操作が失敗した後、公開データを取得する。
    if (operation === 'create') await assert.rejects(mutations.createVersion(version))
    if (operation === 'rename') await assert.rejects(mutations.renameVersion(version.id, version))
    if (operation === 'delete') await assert.rejects(mutations.deleteVersion(version.id))
    await Promise.all([queries.fetchVersions(), queries.fetchMasterData()])

    // Then: 成功済みの公開データを再利用する。
    assert.equal(calls.length, 3)
  })
}

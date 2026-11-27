import test from 'node:test'
import { runSolidBrowserScript } from '../../../test/runSolidBrowserScript'
import { setupTestEnvironment } from '../../../test/setupTestEnvironment'

for (const kind of ['Standard', 'Worldsend']) {
  test(`${kind}楽曲の追加は送信中の連打で二重送信せず、失敗後に再試行できること`, async () => {
    setupTestEnvironment()
    await runSolidBrowserScript(`
      import assert from 'node:assert/strict'
      import { registerHooks } from 'node:module'
      import { createRoot } from 'solid-js'

      // UIのトーストだけを置き換え、送信から応答処理までは実際のhookを通す。
      registerHooks({
        resolve(specifier, context, nextResolve) {
          if (specifier.endsWith('/common/AppToast')) {
            return {
              url: 'data:text/javascript,export const showErrorToast = () => {}; export const showSuccessToast = () => {};',
              shortCircuit: true,
            }
          }
          return nextResolve(specifier, context)
        },
      })
      const { create${kind}SongManagement } =
        await import('./src/pages/song-management/hooks/create${kind}SongManagement.ts')

      // Given: 追加フォームの入力が有効で、初回送信への応答が保留される。
      const firstPost = Promise.withResolvers()
      const postStarted = Promise.withResolvers()
      let postCount = 0
      globalThis.fetch = async (_input, init) => {
        if (init?.method !== 'POST') return Response.json({ songs: [] })
        postCount++
        postStarted.resolve()
        if (postCount === 1) return firstPost.promise
        return new Response(null, { status: 204 })
      }
      const management = createRoot(() => create${kind}SongManagement(
        () => ({ genres: [{ name: 'ORIGINAL' }], difficulties: [] }),
        () => []
      ))
      management.updateCreateDraftField('official_idx', '1234')
      management.updateCreateDraftField('title', '新曲')
      management.updateCreateDraftField('artist', 'artist')
      management.updateCreateDraftField('genre', 'ORIGINAL')

      // When: 追加処理中にもう一度追加を呼ぶ。
      const first = management.create()
      assert.equal(management.creating(), true)
      await postStarted.promise
      await management.create()

      // Then: POSTは1回だけ送信され、失敗後は再試行できる。
      assert.equal(postCount, 1)
      firstPost.resolve(Response.json({}, { status: 500 }))
      await first
      assert.equal(management.creating(), false)
      await management.create()
      assert.equal(postCount, 2)
      assert.equal(management.creating(), false)
    `)
  })
}

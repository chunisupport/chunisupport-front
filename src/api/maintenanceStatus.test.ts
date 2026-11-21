import assert from 'node:assert/strict'
import test from 'node:test'
import { SYSTEM_STATUS_TIMEOUT_MS } from '../constants/maintenance'
import { loadTestModule } from '../test/setupTestEnvironment'

test('応答期限を過ぎれば接続不能となり、呼び出し元からの中止とは区別する', async (t) => {
  const { createAvailabilityRefresher } = await loadTestModule(
    () => import('../usecases/availability/refreshAvailability')
  )
  const { fetchSystemStatus } = await import('./maintenanceStatus')
  t.mock.timers.enable({ apis: ['setTimeout'] })
  t.mock.method(
    globalThis,
    'fetch',
    (_input: unknown, init: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true })
      })
  )
  const checker = createAvailabilityRefresher({ fetchStatus: fetchSystemStatus })
  const cancelled = checker.refresh()
  checker.abort()
  assert.equal((await cancelled).type, 'aborted')

  const pending = checker.refresh()
  t.mock.timers.tick(SYSTEM_STATUS_TIMEOUT_MS)
  const result = await pending
  assert.equal(result.type, 'failure')
  assert.equal(result.state.kind, 'unavailable')
})

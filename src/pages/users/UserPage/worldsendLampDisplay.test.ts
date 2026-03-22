import assert from 'node:assert/strict'
import test from 'node:test'
import { worldsendLampClass, worldsendLampLabel } from './worldsendLampDisplay.ts'
import type { WorldsendRecordDTO } from '../../../types/api'

const createRecord = (overrides: Partial<WorldsendRecordDTO> = {}): WorldsendRecordDTO => ({
  is_played: true,
  updated_at: null,
  id: '1',
  title: 'Test',
  artist: 'Artist',
  level_star: 14,
  attribute: 'TEST',
  notes: 1000,
  score: 1000000,
  img: '',
  clear_lamp: null,
  combo_lamp: null,
  full_chain: null,
  ...overrides,
})

test("未プレイWORLD'S ENDのランプ表示は通常譜面と同じくハイフンになる", () => {
  const record = createRecord({ is_played: false })

  assert.equal(worldsendLampLabel(record), '-')
  assert.equal(worldsendLampClass(record), 'text-gray-500')
})

test('AJ/FCは既存どおりのラベルとスタイルを維持する', () => {
  assert.equal(worldsendLampLabel(createRecord({ combo_lamp: 'ALL JUSTICE' })), 'AJ')
  assert.equal(
    worldsendLampClass(createRecord({ combo_lamp: 'ALL JUSTICE' })),
    'bg-yellow-200 text-yellow-900'
  )
  assert.equal(worldsendLampLabel(createRecord({ combo_lamp: 'FULL COMBO' })), 'FC')
  assert.equal(
    worldsendLampClass(createRecord({ combo_lamp: 'FULL COMBO' })),
    'bg-orange-200 text-orange-900'
  )
})

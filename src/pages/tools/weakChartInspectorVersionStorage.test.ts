import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { WEAK_CHART_INSPECTOR_VERSION_STORAGE_KEY } from './weakChartInspector.constants.ts'
import {
  readWeakChartInspectorVersion,
  saveWeakChartInspectorVersion,
} from './weakChartInspectorVersionStorage'

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
let stored: Map<string, string>

beforeEach(() => {
  stored = new Map()
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => stored.set(key, value),
      },
    },
  })
})

afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
  else Reflect.deleteProperty(globalThis, 'window')
})

test('未保存の場合は新版を返すこと', () => {
  // Given / When / Then
  assert.equal(readWeakChartInspectorVersion(), 'unified')
})

test('保存した版を読み取れること', () => {
  // Given
  saveWeakChartInspectorVersion('legacy')

  // When / Then
  assert.equal(readWeakChartInspectorVersion(), 'legacy')
})

test('不正な保存値は新版として扱うこと', () => {
  // Given
  stored.set(WEAK_CHART_INSPECTOR_VERSION_STORAGE_KEY, 'unknown')

  // When / Then
  assert.equal(readWeakChartInspectorVersion(), 'unified')
})

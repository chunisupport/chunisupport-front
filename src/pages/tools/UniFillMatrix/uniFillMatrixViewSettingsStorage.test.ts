import assert from 'node:assert/strict'
import test from 'node:test'
import {
  UNI_FILL_MATRIX_ACHIEVEMENT_OPTIONS,
  UNI_FILL_MATRIX_DEFAULT_VIEW_SETTINGS,
  UNI_FILL_MATRIX_DIFFICULTY_OPTIONS,
} from './constants'
import {
  readUniFillMatrixViewSettings,
  saveUniFillMatrixViewSettings,
} from './uniFillMatrixViewSettingsStorage'

test('画面を開き直しても全難易度・埋め条件と表示設定を保存値から復元できること', () => {
  // Given: 同じブラウザのストレージを画面間で共有する。
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    },
  })

  try {
    for (const difficulty of UNI_FILL_MATRIX_DIFFICULTY_OPTIONS) {
      for (const achievement of UNI_FILL_MATRIX_ACHIEVEMENT_OPTIONS) {
        const settings = {
          ...UNI_FILL_MATRIX_DEFAULT_VIEW_SETTINGS,
          difficulty: difficulty.value,
          achievement: achievement.value,
          vertical: 'version' as const,
          horizontal: 'nameFolder' as const,
          levelConstAxis: 'chartConstant' as const,
          showPercent: true,
          excludeLockedSongs: true,
        }

        // When: 設定変更を保存し、ページ初期化時と同じ処理で読み直す。
        saveUniFillMatrixViewSettings(settings)
        const restored = readUniFillMatrixViewSettings()

        // Then: 難易度・埋め条件を含む最後の設定を復元する。
        assert.deepEqual(restored, settings)
      }
    }
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})

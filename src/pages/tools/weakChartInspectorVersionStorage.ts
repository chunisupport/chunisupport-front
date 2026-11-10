import {
  WEAK_CHART_INSPECTOR_DEFAULT_VERSION,
  WEAK_CHART_INSPECTOR_VERSION_STORAGE_KEY,
  type WeakChartInspectorVersion,
} from './weakChartInspector.constants.ts'

/**
 * 苦手譜面インスペクターで選択した版を localStorage から読み取る。
 *
 * @returns 保存済みの版。未設定・不正値・読み取り失敗時は既定の版。
 */
export const readWeakChartInspectorVersion = (): WeakChartInspectorVersion => {
  try {
    const value = window.localStorage.getItem(WEAK_CHART_INSPECTOR_VERSION_STORAGE_KEY)
    if (value === 'unified' || value === 'legacy') return value
  } catch {
    return WEAK_CHART_INSPECTOR_DEFAULT_VERSION
  }
  return WEAK_CHART_INSPECTOR_DEFAULT_VERSION
}

/**
 * 苦手譜面インスペクターで選択した版を localStorage へ保存する。
 *
 * @param version - 保存する版。
 * @returns なし。
 */
export const saveWeakChartInspectorVersion = (version: WeakChartInspectorVersion): void => {
  try {
    window.localStorage.setItem(WEAK_CHART_INSPECTOR_VERSION_STORAGE_KEY, version)
  } catch {
    // 保存できない環境でも、現在の版は画面上で維持する。
  }
}

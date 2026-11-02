import { ScanSearch } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { UNIFIED_WEAK_CHART_INSPECTOR_TEST_PATH } from '../../constants/routes'
import { getToolLink } from '../../constants/tools'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import UnifiedWeakChartInspector from './UnifiedWeakChartInspector'

/**
 * 失点加算と到達可能上限補正を試す管理者向けUnified画面。
 * @returns 既存Unifiedと共通の表示・操作を持つ試作分析画面。
 */
const UnifiedWeakChartInspectorTestPage = (): JSX.Element => {
  const tool = getToolLink(UNIFIED_WEAK_CHART_INSPECTOR_TEST_PATH)
  useDocumentTitle(tool.title)

  return (
    <main class="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <header class="flex items-center gap-3">
        <ScanSearch class="h-8 w-8 shrink-0 text-action-primary" aria-hidden="true" />
        <h1 class="text-2xl font-semibold">{tool.title}</h1>
      </header>
      <UnifiedWeakChartInspector experimental />
    </main>
  )
}

export default UnifiedWeakChartInspectorTestPage

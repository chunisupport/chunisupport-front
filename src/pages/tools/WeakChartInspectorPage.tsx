import { ScanSearch } from 'lucide-solid'
import { type Component, createSignal, ErrorBoundary, type JSX, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { LoadError } from '../../components'
import { SegmentedToggleGroup } from '../../components/common/AppTabs'
import { WEAK_CHART_INSPECTOR_PATH } from '../../constants/routes'
import { getToolLink } from '../../constants/tools'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import LegacyWeakChartInspector from './LegacyWeakChartInspector'
import UnifiedWeakChartInspector from './UnifiedWeakChartInspector'
import {
  WEAK_CHART_INSPECTOR_VERSION_LABEL,
  WEAK_CHART_INSPECTOR_VERSION_OPTIONS,
  type WeakChartInspectorVersion,
} from './weakChartInspector.constants'
import {
  readWeakChartInspectorVersion,
  saveWeakChartInspectorVersion,
} from './weakChartInspectorVersionStorage'

/** 版ごとの表示内容 */
const VERSION_VIEWS: Record<WeakChartInspectorVersion, Component> = {
  unified: UnifiedWeakChartInspector,
  legacy: LegacyWeakChartInspector,
}

/**
 * 苦手譜面インスペクターの見出しと版の切り替えを表示する。
 * 片方の版が読み込みに失敗しても切り替えられるよう、エラー境界は版ごとに作り直す。
 *
 * @returns 選択中の版の分析結果を含むツール画面。
 */
const WeakChartInspectorPage = (): JSX.Element => {
  const tool = getToolLink(WEAK_CHART_INSPECTOR_PATH)
  useDocumentTitle(tool.title)
  const [version, setVersion] = createSignal(readWeakChartInspectorVersion())

  /**
   * 選択した版へ切り替え、次回の表示でも使えるよう保存する。
   *
   * @param next - 選択した版。
   * @returns なし。
   */
  const changeVersion = (next: WeakChartInspectorVersion): void => {
    setVersion(next)
    saveWeakChartInspectorVersion(next)
  }

  return (
    <main class="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <ScanSearch class="h-8 w-8 shrink-0 text-action-primary" aria-hidden="true" />
          <h1 class="text-2xl font-semibold">{tool.title}</h1>
        </div>
        <SegmentedToggleGroup
          options={WEAK_CHART_INSPECTOR_VERSION_OPTIONS}
          value={version()}
          onChange={changeVersion}
          ariaLabel={WEAK_CHART_INSPECTOR_VERSION_LABEL}
          itemClass="min-h-10 whitespace-nowrap px-3"
        />
      </header>
      <Show when={version()} keyed>
        {(current) => (
          <ErrorBoundary fallback={(error) => <LoadError error={error} />}>
            <Dynamic component={VERSION_VIEWS[current]} />
          </ErrorBoundary>
        )}
      </Show>
    </main>
  )
}

export default WeakChartInspectorPage

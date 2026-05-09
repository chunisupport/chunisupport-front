import { ChevronDown } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createMemo, createResource, createSignal, ErrorBoundary, Show, Suspense } from 'solid-js'
import { fetchAllSongs, fetchVersionSummaries } from '../../../api/songs'
import { Loading } from '../../../components'
import type { UserRecordDTO } from '../../../types/api'
import { buildOverPowerSummary } from '../../../usecases/overpower/overpowerSummary'
import { OverPowerAllSummary } from './components/OverPowerAllSummary'
import { OverPowerSummaryTable } from './components/OverPowerSummaryTable'

type Props = {
  record: UserRecordDTO
}

const UserOverPower: Component<Props> = (props) => {
  const [allSongs] = createResource(fetchAllSongs)
  const [versionSummaries] = createResource(fetchVersionSummaries)
  const [showLowLevels, setShowLowLevels] = createSignal(false)

  const summary = createMemo(() => {
    const songs = allSongs()
    const versions = versionSummaries()
    if (!songs || !versions) return undefined
    return buildOverPowerSummary(songs.songs, props.record.all, versions.versions)
  })

  const highLevelRows = createMemo(() => summary()?.levels.filter((row) => !row.isLowLevel) ?? [])
  const lowLevelRows = createMemo(() => summary()?.levels.filter((row) => row.isLowLevel) ?? [])

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
        <Show when={summary()} fallback={<Loading />}>
          {(currentSummary) => (
            <div class="mx-4 flex flex-col gap-4 text-sm">
              <OverPowerAllSummary summary={currentSummary().all} />
              <OverPowerSummaryTable
                title="ジャンル別"
                rows={currentSummary().genres}
                countLabel="曲数"
              />
              <OverPowerSummaryTable title="レベル別" rows={highLevelRows()} countLabel="曲数" />
              <Show when={lowLevelRows().length > 0}>
                <section>
                  <button
                    type="button"
                    class="mb-2 flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    aria-expanded={showLowLevels()}
                    onClick={() => setShowLowLevels((value) => !value)}
                  >
                    <span>レベル10未満</span>
                    <ChevronDown
                      class={`h-4 w-4 transition-transform ${showLowLevels() ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  <Show when={showLowLevels()}>
                    <OverPowerSummaryTable
                      title="レベル10未満"
                      rows={lowLevelRows()}
                      countLabel="曲数"
                    />
                  </Show>
                </section>
              </Show>
              <OverPowerSummaryTable
                title="バージョン別"
                rows={currentSummary().versions}
                countLabel="曲数"
              />
              <OverPowerSummaryTable
                title="難易度別"
                rows={currentSummary().difficulties}
                countLabel="譜面数"
              />
            </div>
          )}
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserOverPower

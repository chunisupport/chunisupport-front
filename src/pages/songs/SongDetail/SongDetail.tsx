import { A, useParams } from '@solidjs/router'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  Show,
} from 'solid-js'
import { fetchMasterData, fetchSongByDisplayId, fetchSongStats } from '../../../api/songs'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import SongInfoCard from './components/SongInfoCard'
import SongStatsTabs from './components/SongStatsTabs'

const SongDetail = () => {
  const params = useParams<{ displayid: string }>()

  const [song] = createResource(() => params.displayid, fetchSongByDisplayId)
  const [masterData] = createResource(fetchMasterData)
  const [selectedDifficulty, setSelectedDifficulty] = createSignal<string>('')

  const availableDifficulties = createMemo(() => {
    const currentSong = song()
    const md = masterData()
    if (!currentSong || !md) return []

    return md.difficulties
      .map((difficulty) => difficulty.name)
      .filter((difficultyName) => {
        const key = difficultyName as keyof typeof currentSong.charts
        return Boolean(currentSong.charts[key])
      })
      .map((difficultyName) => ({
        label: difficultyName,
        value: difficultyName.toLowerCase(),
      }))
  })

  createEffect(() => {
    const options = availableDifficulties()
    if (options.length === 0) return
    if (!selectedDifficulty() || !options.some((option) => option.value === selectedDifficulty())) {
      setSelectedDifficulty(options[0].value)
    }
  })

  const [stats] = createResource(
    () => {
      const displayId = params.displayid
      const difficulty = selectedDifficulty()
      if (!displayId || !difficulty) return null
      return { displayId, difficulty }
    },
    (source) => fetchSongStats(source.displayId, source.difficulty)
  )

  useDocumentTitle(() => `${song()?.title ?? '楽曲'} - 楽曲詳細`)

  return (
    <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
      <Show when={!song.loading && song()} fallback={<Loading />}>
        {(songData) => {
          const currentSong = songData()
          return (
            <div class="mx-auto w-full max-w-6xl p-4 space-y-4">
              <div class="text-sm">
                <A href="/songs" class="text-blue-600 hover:underline">
                  ← 楽曲一覧に戻る
                </A>
              </div>

              <h1 class="text-2xl font-semibold">{currentSong.title}</h1>

              <SongInfoCard song={currentSong} availableDifficulties={availableDifficulties()} />

              <SongStatsTabs
                difficulties={availableDifficulties()}
                selectedDifficulty={selectedDifficulty()}
                onDifficultyChange={setSelectedDifficulty}
                stats={stats()}
                isStatsLoading={stats.loading}
              />
            </div>
          )
        }}
      </Show>
    </ErrorBoundary>
  )
}

export default SongDetail

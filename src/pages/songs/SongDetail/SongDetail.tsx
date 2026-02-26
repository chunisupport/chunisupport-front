import { useNavigate, useParams } from '@solidjs/router'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  on,
  Show,
  untrack,
} from 'solid-js'
import { fetchMasterData, fetchSongByDisplayId, fetchSongStats } from '../../../api/songs'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import SongInfoCard from './components/SongInfoCard'
import SongStatsTabs from './components/SongStatsTabs'

const SongDetail = () => {
  const params = useParams<{ displayid: string }>()
  const navigate = useNavigate()

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

  createEffect(
    on(availableDifficulties, (options) => {
      if (options.length === 0) return

      const currentSelection = untrack(() => selectedDifficulty())
      if (!currentSelection || !options.some((option) => option.value === currentSelection)) {
        setSelectedDifficulty(options[0].value)
      }
    })
  )

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

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/songs')
  }

  return (
    <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
      <Show when={!song.loading && song()} fallback={<Loading />}>
        {(songData) => {
          const currentSong = songData()
          return (
            <div class="mx-auto w-full max-w-6xl p-4 space-y-4">
              <div class="text-sm">
                <button
                  type="button"
                  onClick={handleBack}
                  class="text-primary-600 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                >
                  ← 戻る
                </button>
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

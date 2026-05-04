import { useParams, useSearchParams } from '@solidjs/router'
import { createEffect, createMemo, createResource, createSignal, on, untrack } from 'solid-js'
import { fetchSongByDisplayId, fetchSongStats } from '../../../api/songs'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { normalizeDifficultyQueryValue } from '../../../utils/difficultyUtils'
import SongDetailLayout from '../components/SongDetailLayout'
import { useSongDetailBase } from '../components/useSongDetailBase'
import SongInfoCard from './components/SongInfoCard'
import SongStatsTabs from './components/SongStatsTabs'

const SongDetail = () => {
  const params = useParams<{ displayid: string }>()
  const [searchParams] = useSearchParams()

  const [song] = createResource(() => params.displayid, fetchSongByDisplayId)
  const [selectedDifficulty, setSelectedDifficulty] = createSignal<string>('')
  const requestedDifficulty = createMemo(() => normalizeDifficultyQueryValue(searchParams.diff))
  const { masterData, songVersionName, handleBack } = useSongDetailBase(() => song())

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
    on([availableDifficulties, requestedDifficulty], ([options, requested]) => {
      if (options.length === 0) return

      const currentSelection = untrack(() => selectedDifficulty())
      if (!currentSelection || !options.some((option) => option.value === currentSelection)) {
        const defaultDifficulty =
          options.find((option) => option.value === 'master')?.value ?? options[0].value
        const initialDifficulty =
          requested && options.some((option) => option.value === requested)
            ? requested
            : defaultDifficulty
        setSelectedDifficulty(initialDifficulty)
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

  return (
    <SongDetailLayout
      song={song()}
      isSongLoading={song.loading}
      songErrorMessage={song.error?.message}
      title={song()?.title ?? '-'}
      artist={song()?.artist || '-'}
      onBack={handleBack}
      renderInfoCard={(currentSong) => (
        <SongInfoCard
          song={currentSong}
          availableDifficulties={availableDifficulties()}
          versionName={songVersionName()}
        />
      )}
      renderStats={() => (
        <SongStatsTabs
          difficulties={availableDifficulties()}
          selectedDifficulty={selectedDifficulty()}
          onDifficultyChange={setSelectedDifficulty}
          stats={stats()}
          isStatsLoading={stats.loading}
        />
      )}
    />
  )
}

export default SongDetail

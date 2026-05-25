import { useParams, useSearchParams } from '@solidjs/router'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  on,
  Show,
  untrack,
} from 'solid-js'
import { fetchSongByDisplayId, fetchSongStats } from '../../../api/songs'
import { LoadError } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { SongDTO } from '../../../types/api'
import { isNotFoundApiError } from '../../../utils/apiError'
import { normalizeDifficultyQueryValue } from '../../../utils/difficultyUtils'
import NotFoundPage from '../../NotFoundPage'
import SongDetailLayout from '../components/SongDetailLayout'
import { useSongDetailBase } from '../components/useSongDetailBase'
import SongInfoCard from './components/SongInfoCard'
import SongStatsTabs from './components/SongStatsTabs'

type SongDetailLoadState =
  | {
      type: 'loaded'
      song: SongDTO
    }
  | {
      type: 'notFound'
    }
  | {
      type: 'error'
      error: unknown
    }

/**
 * 通常楽曲詳細の初期表示に必要な楽曲情報を取得する。
 *
 * @param displayId - 表示対象の楽曲表示ID。
 * @returns 通常楽曲詳細の初期表示状態。
 */
const fetchSongDetailLoadState = async (displayId: string): Promise<SongDetailLoadState> => {
  try {
    return { type: 'loaded', song: await fetchSongByDisplayId(displayId) }
  } catch (error) {
    if (isNotFoundApiError(error)) {
      return { type: 'notFound' }
    }

    return { type: 'error', error }
  }
}

const SongDetail = () => {
  const params = useParams<{ displayid: string }>()
  const [searchParams] = useSearchParams()

  const [songState] = createResource(() => params.displayid, fetchSongDetailLoadState)
  const song = createMemo(() => {
    const state = songState()
    return state?.type === 'loaded' ? state.song : undefined
  })
  const songLoadError = createMemo(() => {
    const state = songState()
    return state?.type === 'error' ? state.error : undefined
  })
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
    <Show when={songState()?.type !== 'notFound'} fallback={<NotFoundPage />}>
      <Show when={!songLoadError()} fallback={<LoadError error={songLoadError()} />}>
        <SongDetailLayout
          song={song()}
          isSongLoading={songState.loading}
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
      </Show>
    </Show>
  )
}

export default SongDetail

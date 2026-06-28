import { useParams, useSearchParams } from '@solidjs/router'
import { createEffect, createMemo, createResource, createSignal, on, Show, untrack } from 'solid-js'
import {
  fetchOwnSongScoreHistory,
  fetchSongByDisplayId,
  fetchSongStats,
  type ScoreHistoryDifficulty,
} from '../../../api/songs'
import { LoadError } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { authSession } from '../../../stores/authSession'
import type { SongDTO } from '../../../types/api'
import { fetchUserRatingWithCache } from '../../../usecases/cache/fetchUserRatingWithCache'
import { isNotFoundApiError } from '../../../utils/apiError'
import { normalizeDifficultyQueryValue } from '../../../utils/difficultyUtils'
import NotFoundPage from '../../NotFoundPage'
import SongDetailLayout from '../components/SongDetailLayout'
import { useSongDetailBase } from '../components/useSongDetailBase'
import OwnScoreCard, { type OwnScoreItem } from './components/OwnScoreCard'
import SongInfoCard from './components/SongInfoCard'
import SongStatsTabs from './components/SongStatsTabs'
import { SCORE_HISTORY_DIFFICULTIES } from './scoreHistory.constants'

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

/**
 * 存在する履歴対象譜面について、ログインユーザーの現行ベストを取得する。
 *
 * @param displayId - 楽曲表示ID。
 * @param username - ログインユーザー名。
 * @param difficulties - 楽曲に存在する履歴対象難易度。
 * @returns 難易度ごとの現行ベスト。未プレイ譜面は entry を持たない。
 */
const fetchOwnScores = async (
  displayId: string,
  username: string,
  difficulties: readonly ScoreHistoryDifficulty[]
): Promise<OwnScoreItem[]> =>
  Promise.all(
    difficulties.map(async (difficulty) => {
      try {
        const history = await fetchOwnSongScoreHistory(displayId, difficulty, username)
        return { difficulty, entry: history.entries[0] }
      } catch (error) {
        if (isNotFoundApiError(error)) return { difficulty }
        throw error
      }
    })
  )

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
  const [ownRating] = createResource(
    () => (authSession.status === 'authenticated' ? authSession.user?.username : null),
    fetchUserRatingWithCache
  )
  const ownBestAverage = createMemo(() => ownRating()?.best_average)
  const ownScoreDifficulties = createMemo(() => {
    const currentSong = song()
    if (!currentSong) return []
    return SCORE_HISTORY_DIFFICULTIES.filter((difficulty) =>
      Boolean(currentSong.charts[difficulty])
    )
  })
  const [ownScores] = createResource(
    () => {
      const username = authSession.status === 'authenticated' ? authSession.user?.username : null
      const displayId = song()?.id
      const difficulties = ownScoreDifficulties()
      if (!username || !displayId || difficulties.length === 0) return null
      return { displayId, username, difficulties }
    },
    (source) => fetchOwnScores(source.displayId, source.username, source.difficulties)
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
          renderStats={(currentSong) => (
            <>
              <Show
                when={authSession.status === 'authenticated' && ownScoreDifficulties().length > 0}
              >
                <OwnScoreCard
                  displayId={currentSong.id}
                  items={
                    ownScores() ?? ownScoreDifficulties().map((difficulty) => ({ difficulty }))
                  }
                  loading={ownScores.loading}
                />
              </Show>
              <SongStatsTabs
                difficulties={availableDifficulties()}
                selectedDifficulty={selectedDifficulty()}
                onDifficultyChange={setSelectedDifficulty}
                stats={stats()}
                isStatsLoading={stats.loading}
                bestAverage={ownBestAverage()}
                ratingBands={masterData()?.rating_bands}
              />
            </>
          )}
        />
      </Show>
    </Show>
  )
}

export default SongDetail

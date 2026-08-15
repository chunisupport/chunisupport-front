import { useParams, useSearchParams } from '@solidjs/router'
import { createEffect, createMemo, createResource, createSignal, on, Show, untrack } from 'solid-js'
import { fetchSongByDisplayId, fetchSongStats } from '../../../api/songs'
import { LoadError } from '../../../components'
import { normalizePlayerDataDifficulty } from '../../../constants/difficulty'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { authSession } from '../../../stores/authSession'
import type { PlayerRecordDTO, SongDTO } from '../../../types/api'
import { fetchUserRatingWithCache } from '../../../usecases/cache/fetchUserRatingWithCache'
import { fetchUserStandardSongRecordWithCache } from '../../../usecases/cache/fetchUserSongRecordWithCache'
import { isNotFoundApiError } from '../../../utils/apiError'
import { normalizeDifficultyQueryValue } from '../../../utils/difficultyUtils'
import NotFoundPage from '../../NotFoundPage'
import SongDetailLayout from '../components/SongDetailLayout'
import { useSongDetailBase } from '../components/useSongDetailBase'
import OwnScoreCard, { type OwnScoreItem } from './components/OwnScoreCard'
import SongInfoCard from './components/SongInfoCard'
import SongStatsTabs from './components/SongStatsTabs'
import { OWN_SCORE_DIFFICULTIES, supportsScoreHistory } from './scoreHistory.constants'

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
 * 楽曲に存在する全譜面の自己スコア表示項目を構築する。
 *
 * @param song - 表示対象の楽曲。
 * @param records - ログインユーザーの通常譜面レコード。
 * @returns 難易度ごとの自己スコアとランプの表示項目。
 */
const buildOwnScoreItems = (song: SongDTO, records: readonly PlayerRecordDTO[]): OwnScoreItem[] =>
  OWN_SCORE_DIFFICULTIES.filter((difficulty) => Boolean(song.charts[difficulty])).map(
    (difficulty) => {
      const record = records.find(
        (candidate) =>
          candidate.id === song.id && candidate.difficulty === difficulty && candidate.is_played
      )

      return {
        difficulty,
        score: record?.score,
        comboLamp: record?.combo_lamp,
        clearLamp: record?.clear_lamp,
        fullChain: record?.full_chain,
        supportsHistory: supportsScoreHistory(difficulty),
      }
    }
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

    return md.difficulties.flatMap((difficulty) => {
      const difficultyName = normalizePlayerDataDifficulty(difficulty.name)
      if (!difficultyName || !currentSong.charts[difficultyName]) return []
      return [{ label: difficultyName, value: difficultyName }]
    })
  })

  createEffect(
    on([availableDifficulties, requestedDifficulty], ([options, requested]) => {
      if (options.length === 0) return

      const currentSelection = untrack(() => selectedDifficulty())
      if (!currentSelection || !options.some((option) => option.value === currentSelection)) {
        const defaultDifficulty =
          options.find((option) => option.value === 'MASTER')?.value ?? options[0].value
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
  const [ownRecords] = createResource(
    () => {
      const username =
        authSession.status === 'authenticated' ? authSession.user?.username : undefined
      const displayId = params.displayid
      return username && displayId ? { username, displayId } : null
    },
    ({ username, displayId }) => fetchUserStandardSongRecordWithCache(username, displayId)
  )
  const ownBestAverage = createMemo(() => ownRating()?.best_average)
  /** 統計再取得中も直前の表示データを残し、画面高さの急変を防ぐ。 */
  const displayedStats = createMemo(() => stats.latest ?? stats())
  const ownScoreItems = createMemo(() => {
    const currentSong = song()
    if (!currentSong) return []
    return buildOwnScoreItems(currentSong, ownRecords() ?? [])
  })
  /** 選択中の難易度に対応するログインユーザーのプレイ済みスコアを取得する。 */
  const selectedOwnScore = createMemo(() => {
    if (authSession.status !== 'authenticated') return undefined

    const difficulty = normalizePlayerDataDifficulty(selectedDifficulty())
    if (!difficulty) return undefined
    return ownScoreItems().find((item) => item.difficulty === difficulty)?.score
  })

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
              <Show when={authSession.status === 'authenticated' && ownScoreItems().length > 0}>
                <OwnScoreCard
                  displayId={currentSong.id}
                  items={ownScoreItems()}
                  loading={ownRecords.loading}
                />
              </Show>
              <SongStatsTabs
                difficulties={availableDifficulties()}
                selectedDifficulty={selectedDifficulty()}
                onDifficultyChange={setSelectedDifficulty}
                stats={displayedStats()}
                isStatsLoading={stats.loading}
                bestAverage={ownBestAverage()}
                ratingBands={masterData()?.rating_bands}
                ownScore={selectedOwnScore()}
              />
            </>
          )}
        />
      </Show>
    </Show>
  )
}

export default SongDetail

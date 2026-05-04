import { useParams } from '@solidjs/router'
import { createMemo, createResource, Show } from 'solid-js'
import { fetchSongStats, fetchWorldsendSongByDisplayId } from '../../../api/songs'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import SongDetailLayout from '../components/SongDetailLayout'
import { useSongDetailBase } from '../components/useSongDetailBase'
import SongStatsTabs from '../SongDetail/components/SongStatsTabs'
import { getWorldsendTitleMeta } from '../worldsendDetailModel'
import WorldsendSongInfoCard from './components/WorldsendSongInfoCard'
import { getWorldsendDisplayIdSource } from './worldsendRouteParams'

const worldsendDifficulty = [{ label: "WORLD'S END", value: 'worldsend' }]

const WorldsendSongDetail = () => {
  const params = useParams<{ displayid: string }>()

  const displayIdSource = () => getWorldsendDisplayIdSource(params.displayid)

  const [song] = createResource(displayIdSource, fetchWorldsendSongByDisplayId)
  const { songVersionName, handleBack } = useSongDetailBase(() => song())
  const [stats] = createResource(displayIdSource, (displayId) =>
    fetchSongStats(displayId, worldsendDifficulty[0].value)
  )

  const titleMeta = createMemo(() => {
    const currentSong = song()
    if (!currentSong) return { title: '-', artist: '-' }
    return getWorldsendTitleMeta(currentSong)
  })

  useDocumentTitle(() => `${song()?.title ?? "WORLD'S END楽曲"} - WORLD'S END楽曲詳細`)

  return (
    <SongDetailLayout
      song={song()}
      isSongLoading={song.loading}
      songErrorMessage={song.error?.message}
      title={titleMeta().title}
      artist={titleMeta().artist}
      onBack={handleBack}
      renderInfoCard={(currentSong) => (
        <WorldsendSongInfoCard song={currentSong} versionName={songVersionName()} />
      )}
      renderStats={() => (
        <>
          <Show when={stats.error} keyed>
            {(err) => <p class="text-red-500">Error loading stats: {err.message}</p>}
          </Show>
          <Show when={!stats.error}>
            <SongStatsTabs
              difficulties={worldsendDifficulty}
              readonlyDifficulty={worldsendDifficulty[0].value}
              stats={stats()}
              isStatsLoading={stats.loading}
            />
          </Show>
        </>
      )}
    />
  )
}

export default WorldsendSongDetail

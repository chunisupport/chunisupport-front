import { useNavigate } from '@solidjs/router'
import { createMemo, createResource } from 'solid-js'
import { fetchMasterData, fetchVersionSummaries } from '../../../api/songs'
import {
  getShortVersionName,
  resolveVersionNameByReleaseDate,
} from '../../../utils/versionConverter'

type ReleaseSong = {
  release: string
}

export const useSongDetailBase = (song: () => ReleaseSong | undefined) => {
  const navigate = useNavigate()
  const [masterData] = createResource(fetchMasterData)
  const [versionData] = createResource(fetchVersionSummaries)

  const songVersionName = createMemo(() => {
    const currentSong = song()
    const versions = versionData()?.versions
    if (!currentSong || !versions) return '不明'

    return getShortVersionName(resolveVersionNameByReleaseDate(currentSong.release, versions))
  })

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/songs')
  }

  return {
    masterData,
    songVersionName,
    handleBack,
  }
}

import { createResource, Show } from 'solid-js'
import { fetchMasterData } from '../../api/songs'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import StandardSongCreateSection from './components/StandardSongCreateSection'
import StandardSongEditSection from './components/StandardSongEditSection'
import WorldsendSongCreateSection from './components/WorldsendSongCreateSection'
import WorldsendSongEditSection from './components/WorldsendSongEditSection'
import { SONG_MANAGEMENT_SECTION_COPY } from './constants'
import { createStandardSongManagement } from './hooks/createStandardSongManagement'
import { createWorldsendSongManagement } from './hooks/createWorldsendSongManagement'

type SongManagementPageProps = {
  title: string
  canCreate: boolean
  canDelete: boolean
  /** 管理用の属性・欠落フィルターを表示するか */
  showAdvancedFilters: boolean
}

/**
 * 権限を持つユーザー向けの楽曲管理画面を描画します。
 * 通常楽曲およびWORLD'S END楽曲の追加・更新・削除・復活操作を提供します。
 *
 * @param props 画面タイトルと許可する操作を含むプロパティ
 * @returns 楽曲管理UI
 */
const SongManagementPage = (props: SongManagementPageProps) => {
  useDocumentTitle(props.title)

  const [masterData] = createResource(fetchMasterData)
  const standard = createStandardSongManagement(masterData)
  const worldsend = createWorldsendSongManagement(masterData)

  const genres = () => masterData()?.genres ?? []
  const versions = () => masterData()?.versions ?? []

  return (
    <div class="song-management mx-auto w-full max-w-6xl p-4 space-y-6">
      <style>{`
        .song-management input[type='number'] {
          appearance: textfield;
          -moz-appearance: textfield;
        }

        .song-management input[type='number']::-webkit-outer-spin-button,
        .song-management input[type='number']::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
      <div>
        <h1 class="text-2xl font-semibold">{props.title}</h1>
        <p class="mt-2 text-sm text-text-muted">{SONG_MANAGEMENT_SECTION_COPY.description}</p>
      </div>

      <StandardSongEditSection
        management={standard}
        masterDataLoading={masterData.loading}
        genres={genres()}
        versions={versions()}
        canDelete={props.canDelete}
        showAdvancedFilters={props.showAdvancedFilters}
      />

      <WorldsendSongEditSection
        management={worldsend}
        standardSongs={standard.songs()}
        standardSongsLoading={standard.songsLoading()}
        masterDataLoading={masterData.loading}
        genres={genres()}
        versions={versions()}
        canDelete={props.canDelete}
        showAdvancedFilters={props.showAdvancedFilters}
      />

      <Show when={props.canCreate}>
        <StandardSongCreateSection management={standard} genres={genres()} />
        <WorldsendSongCreateSection
          management={worldsend}
          standardSongs={standard.songs()}
          standardSongsLoading={standard.songsLoading()}
          genres={genres()}
        />
      </Show>
    </div>
  )
}

export default SongManagementPage

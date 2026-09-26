import SongManagementPage from '../song-management/SongManagementPage'
import { PAGE_TITLES } from './constants'

/**
 * EDITOR向けの楽曲編集画面を表示する。
 *
 * @returns 共通の楽曲管理UIを利用した楽曲編集画面。
 */
const EditorSongsPage = () => {
  return (
    <SongManagementPage
      title={PAGE_TITLES.editorSongs}
      canCreate={false}
      canDelete={false}
      showAdvancedFilters={false}
    />
  )
}

export default EditorSongsPage

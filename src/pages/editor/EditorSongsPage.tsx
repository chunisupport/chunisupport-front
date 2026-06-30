import SongManagementPage from '../songs/SongManagementPage'
import { EDITOR_SONGS_TITLE } from './constants'

/**
 * EDITOR向けの楽曲編集画面を表示する。
 *
 * @returns 共通の楽曲管理UIを利用した楽曲編集画面。
 */
const EditorSongsPage = () => {
  return <SongManagementPage title={EDITOR_SONGS_TITLE} canCreate={false} canDelete={false} />
}

export default EditorSongsPage

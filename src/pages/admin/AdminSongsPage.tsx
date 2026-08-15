import SongManagementPage from '../songs/SongManagementPage'

/**
 * ADMIN向けの楽曲管理画面を表示する。
 *
 * @returns すべての楽曲管理操作を許可した共通画面。
 */
const AdminSongsPage = () => {
  return <SongManagementPage title="楽曲管理（ADMIN）" canCreate canDelete />
}

export default AdminSongsPage

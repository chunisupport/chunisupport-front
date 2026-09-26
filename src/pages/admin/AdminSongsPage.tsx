import { t } from '../../i18n'
import SongManagementPage from '../song-management/SongManagementPage'

/**
 * ADMIN向けの楽曲管理画面を表示する。
 *
 * @returns すべての楽曲管理操作を許可した共通画面。
 */
const AdminSongsPage = () => {
  return (
    <SongManagementPage title={t('admin.songsTitle')} canCreate canDelete showAdvancedFilters />
  )
}

export default AdminSongsPage

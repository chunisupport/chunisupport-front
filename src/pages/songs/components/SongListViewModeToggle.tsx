import { CardTableViewToggle } from '../../../components/common/CardTableViewToggle'
import { songListViewMode, toggleSongListViewMode } from '../songListViewMode'

/**
 * 楽曲一覧のカード表示と表表示を切り替える。
 *
 * @returns 切り替え先の表示形式を示すアイコンボタン。
 */
const SongListViewModeToggle = () => {
  return <CardTableViewToggle viewMode={songListViewMode()} onClick={toggleSongListViewMode} />
}

export default SongListViewModeToggle

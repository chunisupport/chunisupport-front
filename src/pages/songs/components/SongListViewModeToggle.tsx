import { LayoutGrid, Table2 } from 'lucide-solid'
import { AppIconButton } from '../../../components/common/AppButton'
import { SONG_LIST_VIEW_TOGGLE_COPY } from '../constants'
import { songListViewMode, toggleSongListViewMode } from '../songListViewMode'

/**
 * 楽曲一覧のカード表示と表表示を切り替える。
 *
 * @returns 切り替え先の表示形式を示すアイコンボタン。
 */
const SongListViewModeToggle = () => {
  const isCardView = () => songListViewMode() === 'card'
  const switchLabel = () =>
    isCardView() ? SONG_LIST_VIEW_TOGGLE_COPY.toTable : SONG_LIST_VIEW_TOGGLE_COPY.toCard

  return (
    <AppIconButton
      size="md"
      aria-label={switchLabel()}
      title={switchLabel()}
      onClick={toggleSongListViewMode}
    >
      {isCardView() ? (
        <Table2 size={20} aria-hidden="true" />
      ) : (
        <LayoutGrid size={20} aria-hidden="true" />
      )}
    </AppIconButton>
  )
}

export default SongListViewModeToggle

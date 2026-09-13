import { AppSelect } from '../../../../components/common/AppSelect'
import type { SortDirection } from '../../../../utils/sortingQuery'
import {
  SONG_CARD_COPY,
  SONG_CARD_DEFAULT_SORT_OPTION_ID,
  SONG_CARD_SORT_DIRECTION_OPTIONS,
  SONG_CARD_SORT_OPTIONS,
  type SongCardSortDirectionOption,
  type SongCardSortOption,
} from '../constants'
import { findSongCardSortDirectionOption, findSongCardSortOption } from '../utils/songCardSort'

type SongCardSortControlsProps = {
  sortOptionId: string
  sortDirection: SortDirection
  onSortOptionChange: (optionId: string) => void
  onSortDirectionChange: (direction: SortDirection) => void
}

/**
 * カード一覧のソートキーと昇順・降順 Select を表示する。
 *
 * @param props - 現在のソート状態と変更通知。
 * @returns ソート操作用の Select 群。
 */
const SongCardSortControls = (props: SongCardSortControlsProps) => {
  const isDefaultSort = () => props.sortOptionId === SONG_CARD_DEFAULT_SORT_OPTION_ID

  return (
    <div class="flex min-w-0 items-end gap-2">
      <AppSelect<SongCardSortOption>
        options={SONG_CARD_SORT_OPTIONS}
        optionValue="id"
        optionTextValue="label"
        value={findSongCardSortOption(props.sortOptionId)}
        onChange={(option) => {
          if (option) props.onSortOptionChange(option.id)
        }}
        label={SONG_CARD_COPY.sortKeyLabel}
        labelVariant="srOnly"
        formatLabel={(option) => option.label}
        rootClass="w-40 shrink-0"
        triggerClass="h-9.5"
        triggerId="songs-card-sort-key"
      />
      <AppSelect<SongCardSortDirectionOption>
        options={SONG_CARD_SORT_DIRECTION_OPTIONS}
        optionValue="value"
        optionTextValue="label"
        value={findSongCardSortDirectionOption(props.sortDirection)}
        onChange={(option) => {
          if (option) props.onSortDirectionChange(option.value)
        }}
        disabled={isDefaultSort()}
        label={SONG_CARD_COPY.sortDirectionLabel}
        labelVariant="srOnly"
        formatLabel={(option) => option.label}
        rootClass="w-24 shrink-0"
        triggerClass="h-9.5"
        triggerId="songs-card-sort-direction"
      />
    </div>
  )
}

export default SongCardSortControls

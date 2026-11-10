import { AppSelect } from '../../../../components/common/AppSelect'
import type { SortDirection } from '../../../../utils/sortingQuery'
import {
  WORLDSEND_SONG_CARD_COPY,
  WORLDSEND_SONG_CARD_DEFAULT_SORT_OPTION_ID,
  WORLDSEND_SONG_CARD_SORT_DIRECTION_OPTIONS,
  WORLDSEND_SONG_CARD_SORT_OPTIONS,
  type WorldsendSongCardSortDirectionOption,
  type WorldsendSongCardSortOption,
} from '../constants'
import {
  findWorldsendSongCardSortDirectionOption,
  findWorldsendSongCardSortOption,
} from '../utils/worldsendSongCardSort'

type WorldsendSongCardSortControlsProps = {
  sortOptionId: string
  sortDirection: SortDirection
  onSortOptionChange: (optionId: string) => void
  onSortDirectionChange: (direction: SortDirection) => void
}

/**
 * WORLD'S END カード一覧のソートキーと昇順・降順 Select を表示する。
 *
 * @param props - 現在のソート状態と変更通知。
 * @returns ソート操作用の Select 群。
 */
const WorldsendSongCardSortControls = (props: WorldsendSongCardSortControlsProps) => {
  const isDefaultSort = () => props.sortOptionId === WORLDSEND_SONG_CARD_DEFAULT_SORT_OPTION_ID

  return (
    <div class="flex min-w-0 items-end gap-2">
      <AppSelect<WorldsendSongCardSortOption>
        options={WORLDSEND_SONG_CARD_SORT_OPTIONS}
        optionValue="id"
        optionTextValue="label"
        value={findWorldsendSongCardSortOption(props.sortOptionId)}
        onChange={(option) => {
          if (option) props.onSortOptionChange(option.id)
        }}
        label={WORLDSEND_SONG_CARD_COPY.sortKeyLabel}
        labelVariant="srOnly"
        formatLabel={(option) => option.label}
        rootClass="w-40 shrink-0"
        triggerClass="h-9.5"
        triggerId="worldsend-songs-card-sort-key"
      />
      <AppSelect<WorldsendSongCardSortDirectionOption>
        options={WORLDSEND_SONG_CARD_SORT_DIRECTION_OPTIONS}
        optionValue="value"
        optionTextValue="label"
        value={findWorldsendSongCardSortDirectionOption(props.sortDirection)}
        onChange={(option) => {
          if (option) props.onSortDirectionChange(option.value)
        }}
        disabled={isDefaultSort()}
        label={WORLDSEND_SONG_CARD_COPY.sortDirectionLabel}
        labelVariant="srOnly"
        formatLabel={(option) => option.label}
        rootClass="w-24 shrink-0"
        triggerClass="h-9.5"
        triggerId="worldsend-songs-card-sort-direction"
      />
    </div>
  )
}

export default WorldsendSongCardSortControls

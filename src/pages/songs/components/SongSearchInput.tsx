import { SearchTextField } from '../../../components/common/SearchTextField'
import { localizedCopy } from '../../../i18n'

/** 楽曲検索欄の表示文言 */
const SONG_SEARCH_COPY = localizedCopy('songs.search')

type SongSearchInputProps = {
  id: string
  value: string
  onInput: (value: string) => void
}

/**
 * 楽曲名・アーティスト名での検索入力欄を描画するコンポーネント。
 * @param props 入力欄の識別子・現在値・入力変更ハンドラ。
 * @returns 楽曲検索用の入力UI。
 */
const SongSearchInput = (props: SongSearchInputProps) => {
  return (
    <SearchTextField
      id={props.id}
      class="min-w-0 flex-1"
      frameClass="rounded-l border-r-0"
      label={SONG_SEARCH_COPY.label}
      ariaLabel={SONG_SEARCH_COPY.label}
      value={props.value}
      active={props.value.trim().length > 0}
      onChange={props.onInput}
      placeholder={SONG_SEARCH_COPY.placeholder}
    />
  )
}

export default SongSearchInput

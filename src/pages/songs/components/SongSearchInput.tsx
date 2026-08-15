import { SearchTextField } from '../../../components/common/SearchTextField'

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
      class="max-w-md"
      label="楽曲検索"
      ariaLabel="楽曲検索"
      value={props.value}
      active={props.value.trim().length > 0}
      onChange={props.onInput}
      placeholder="曲名・アーティスト名で検索"
    />
  )
}

export default SongSearchInput

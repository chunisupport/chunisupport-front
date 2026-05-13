type SongSearchInputProps = {
  id: string
  value: string
  onInput: (value: string) => void
}

const SongSearchInput = (props: SongSearchInputProps) => {
  return (
    <div class="max-w-md">
      <label class="mb-1 block text-sm font-medium text-gray-700" for={props.id}>
        楽曲検索
      </label>
      <input
        id={props.id}
        type="search"
        value={props.value}
        onInput={(event) => props.onInput(event.currentTarget.value)}
        placeholder="曲名・アーティスト名で検索"
        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      />
    </div>
  )
}

export default SongSearchInput

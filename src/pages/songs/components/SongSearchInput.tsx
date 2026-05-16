import { Search } from 'lucide-solid'

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
      <div class="flex items-center gap-2 rounded-md border border-gray-300 px-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30">
        <Search class="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
        <input
          id={props.id}
          type="search"
          value={props.value}
          onInput={(event) => props.onInput(event.currentTarget.value)}
          placeholder="曲名・アーティスト名で検索"
          class="min-w-0 flex-1 py-2 text-sm outline-none"
        />
      </div>
    </div>
  )
}

export default SongSearchInput

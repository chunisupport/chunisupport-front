import { For } from 'solid-js'
import { CHUNITHM_JACKET_BASE_URL } from '../../../../config'
import type { WorldsendSongDTO } from '../../../../types/api'
import { getWorldsendSongInfoItems } from '../../worldsendDetailModel'

type Props = {
  song: WorldsendSongDTO
}

const WorldsendSongInfoCard = (props: Props) => {
  const jacketUrl = () => {
    if (!props.song.jacket) return null
    return `${CHUNITHM_JACKET_BASE_URL}/${props.song.jacket}.webp`
  }

  return (
    <div class="space-y-4 lg:grid lg:grid-cols-[240px_minmax(0,220px)_minmax(0,1fr)] lg:items-start lg:gap-4 lg:space-y-0">
      <div class="grid grid-cols-[minmax(0,42vw)_minmax(0,1fr)] items-start gap-4 lg:contents">
        <div class="aspect-square w-full overflow-hidden rounded-md border border-gray-200 bg-white">
          {jacketUrl() ? (
            <img
              src={jacketUrl() ?? undefined}
              alt={`${props.song.title}のジャケット`}
              class="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div class="flex h-full w-full items-center justify-center bg-gray-50 p-4 text-sm text-gray-400">
              ジャケットなし
            </div>
          )}
        </div>

        <div class="grid gap-4 rounded-md border border-gray-200 bg-white p-4">
          <For each={getWorldsendSongInfoItems(props.song)}>
            {(item) => (
              <div class="space-y-1">
                <p class="text-xs font-medium text-gray-500">{item.label}</p>
                <p class="text-sm text-gray-900">{item.value}</p>
              </div>
            )}
          </For>
        </div>
      </div>

      <div class="rounded-md border border-gray-200 bg-white p-4">
        <div class="flex h-full items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          WORLD'S END は特殊譜面のため、難易度タブではなく専用の譜面情報を下部に表示しています。
        </div>
      </div>
    </div>
  )
}

export default WorldsendSongInfoCard

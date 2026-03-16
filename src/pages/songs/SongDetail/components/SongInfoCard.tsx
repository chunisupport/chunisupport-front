import { For } from 'solid-js'
import { CHUNITHM_JACKET_BASE_URL } from '../../../../config'
import type { SongDTO } from '../../../../types/api'

type DifficultyOption = {
  label: string
  value: string
}

type Props = {
  song: SongDTO
  availableDifficulties: DifficultyOption[]
}

const SongInfoCard = (props: Props) => {
  const jacketUrl = () => {
    if (!props.song.jacket) return null
    return `${CHUNITHM_JACKET_BASE_URL}/${props.song.jacket}.webp`
  }

  return (
    <div class="space-y-4 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-4 lg:space-y-0">
      <div class="grid items-start gap-4 grid-cols-[minmax(0,50vw)_minmax(0,1fr)] lg:block">
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

        <div class="grid gap-2 rounded-md border border-gray-200 bg-white p-4 text-sm md:grid-cols-2 lg:hidden">
          <p>
            <span class="text-gray-500">ID:</span> {props.song.id}
          </p>
          <p>
            <span class="text-gray-500">アーティスト:</span> {props.song.artist}
          </p>
          <p>
            <span class="text-gray-500">ジャンル:</span> {props.song.genre}
          </p>
          <p>
            <span class="text-gray-500">BPM:</span> {props.song.bpm ?? '-'}
          </p>
          <p>
            <span class="text-gray-500">リリース:</span> {props.song.release ?? '-'}
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="hidden gap-2 rounded-md border border-gray-200 bg-white p-4 text-sm md:grid-cols-2 lg:grid">
          <p>
            <span class="text-gray-500">ID:</span> {props.song.id}
          </p>
          <p>
            <span class="text-gray-500">アーティスト:</span> {props.song.artist}
          </p>
          <p>
            <span class="text-gray-500">ジャンル:</span> {props.song.genre}
          </p>
          <p>
            <span class="text-gray-500">BPM:</span> {props.song.bpm ?? '-'}
          </p>
          <p>
            <span class="text-gray-500">リリース:</span> {props.song.release ?? '-'}
          </p>
        </div>

        <div class="rounded-md border border-gray-200 bg-white p-4">
          <h2 class="mb-2 text-lg font-semibold">譜面情報</h2>
          <div class="flex flex-wrap gap-2 text-sm">
            <For each={props.availableDifficulties}>
              {(difficulty) => {
                const key = difficulty.label as keyof typeof props.song.charts
                const chart = props.song.charts[key]
                return (
                  <div class="rounded border border-gray-200 px-3 py-2">
                    <p class="font-semibold">{difficulty.label}</p>
                    <p>
                      定数:{' '}
                      {chart ? `${chart.const.toFixed(1)}${chart.is_const_unknown ? '?' : ''}` : '-'}
                    </p>
                    <p>ノーツ: {chart?.notes ?? '-'}</p>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SongInfoCard

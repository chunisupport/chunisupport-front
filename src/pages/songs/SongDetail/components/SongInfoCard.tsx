import { For } from 'solid-js'
import { CHUNITHM_JACKET_BASE_URL } from '../../../../config'
import type { SongDTO } from '../../../../types/api'

const difficultyRowClass: Record<string, string> = {
  BASIC: 'bg-[#00ab84] text-white',
  ADVANCED: 'bg-[#ff7e00] text-white',
  EXPERT: 'bg-[#f12929] text-white',
  MASTER: 'bg-[#8e1be5] text-white',
  ULTIMA: 'bg-[#000000] text-white',
}

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
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 text-left">
                <tr>
                  <th class="px-3 py-2 font-medium text-gray-700"></th>
                  <th class="px-3 py-2 font-medium text-gray-700">譜面定数</th>
                  <th class="px-3 py-2 font-medium text-gray-700">ノーツ数</th>
                </tr>
              </thead>
              <tbody>
                <For each={props.availableDifficulties}>
                  {(difficulty) => {
                    const key = difficulty.label as keyof typeof props.song.charts
                    const chart = props.song.charts[key]
                    return (
                      <tr class="border-t border-gray-100">
                        <td class="px-3 py-2">
                          <span
                            class={`inline-flex min-w-[7rem] justify-center rounded px-3 py-1 text-xs font-semibold tracking-wide ${difficultyRowClass[difficulty.label] ?? 'bg-gray-200 text-gray-800'}`}
                          >
                            {difficulty.label}
                          </span>
                        </td>
                        <td class="px-3 py-2 text-gray-800">
                          {chart ? `${chart.const.toFixed(1)}${chart.is_const_unknown ? '?' : ''}` : '-'}
                        </td>
                        <td class="px-3 py-2 text-gray-800">{chart?.notes ?? '-'}</td>
                      </tr>
                    )
                  }}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SongInfoCard

import { createEffect, createSignal, For, type JSX } from 'solid-js'
import { CHUNITHM_JACKET_BASE_URL } from '../../../config'

export type SongMetaInfoItem = {
  label: string
  value: string | number
}

type Props = {
  title: string
  jacket: string | null
  infoItems: SongMetaInfoItem[]
  children: JSX.Element
}

const SongMetaCardLayout = (props: Props) => {
  const [hasJacketLoadError, setHasJacketLoadError] = createSignal(false)

  const jacketUrl = () => {
    if (!props.jacket) return null
    return `${CHUNITHM_JACKET_BASE_URL}/${props.jacket}.webp`
  }

  createEffect(() => {
    jacketUrl()
    setHasJacketLoadError(false)
  })

  return (
    <div class="space-y-4 lg:grid lg:grid-cols-[240px_minmax(0,220px)_minmax(0,1fr)] lg:items-start lg:gap-4 lg:space-y-0">
      <div class="grid grid-cols-[minmax(0,42vw)_minmax(0,1fr)] items-start gap-4 lg:contents">
        <div class="aspect-square w-full overflow-hidden rounded-md border border-gray-200 bg-white">
          {jacketUrl() && !hasJacketLoadError() ? (
            <img
              src={jacketUrl() ?? undefined}
              alt={`${props.title}のジャケット`}
              class="h-full w-full object-cover"
              loading="lazy"
              onError={() => setHasJacketLoadError(true)}
            />
          ) : (
            <div class="flex h-full w-full items-center justify-center bg-gray-50 p-4 text-sm text-gray-400">
              ジャケットなし
            </div>
          )}
        </div>

        <div class="grid gap-2 rounded-md border border-gray-200 bg-white p-4">
          <For each={props.infoItems}>
            {(item) => (
              <div class="space-y-[2px]">
                <p class="text-xs font-medium text-gray-500">{item.label}</p>
                <p class="text-sm text-gray-900">{item.value}</p>
              </div>
            )}
          </For>
        </div>
      </div>

      {props.children}
    </div>
  )
}

export default SongMetaCardLayout

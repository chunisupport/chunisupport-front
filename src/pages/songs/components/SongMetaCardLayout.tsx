import { Image } from '@kobalte/core/image'
import { For, type JSX } from 'solid-js'
import { CHUNITHM_JACKET_BASE_URL } from '../../../constants/jackets'

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
  const jacketUrl = () => {
    if (!props.jacket) return null
    return `${CHUNITHM_JACKET_BASE_URL}/${props.jacket}.webp`
  }

  return (
    <div class="space-y-4 lg:grid lg:grid-cols-[240px_minmax(0,220px)_minmax(0,1fr)] lg:items-start lg:gap-4 lg:space-y-0">
      <div class="grid grid-cols-[minmax(0,42vw)_minmax(0,1fr)] items-start gap-4 lg:contents">
        <Image class="block aspect-square w-full overflow-hidden rounded-md border border-border bg-surface">
          <Image.Img
            src={jacketUrl() ?? undefined}
            alt={`${props.title}のジャケット`}
            class="h-full w-full object-cover"
          />
          <Image.Fallback>
            <img
              src="/placeholder.png"
              alt={`${props.title}のジャケット（フォールバック）`}
              class="h-full w-full object-cover"
            />
          </Image.Fallback>
        </Image>

        <div class="grid gap-2 rounded-md border border-border bg-surface p-4">
          <For each={props.infoItems}>
            {(item) => (
              <div class="space-y-[2px]">
                <p class="text-xs font-medium text-text-subtle">{item.label}</p>
                <p class="text-sm text-text">{item.value}</p>
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

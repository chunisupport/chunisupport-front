import { For, type JSX } from 'solid-js'
import placeholderImageUrl from '../../../assets/placeholder.png'
import { JacketImage } from '../../../components/common/JacketImage'
import { buildChunithmJacketUrl } from '../../../utils/jacket'

export type SongMetaInfoItem = {
  label: string
  value: string | number
}

type Props = {
  title: string
  jacket: string | null
  infoItems: SongMetaInfoItem[]
  /** 楽曲情報カード右上へ重ねて表示する操作 */
  infoAction?: JSX.Element
  children: JSX.Element
}

/**
 * 楽曲メタ情報とジャケットをカード形式で表示する。
 *
 * @param props - 楽曲タイトル、ジャケット画像ID、表示項目、追加表示領域。
 * @returns 楽曲の基本情報カードと追加表示領域。
 */
const SongMetaCardLayout = (props: Props) => {
  const jacketUrl = () => buildChunithmJacketUrl(props.jacket)

  return (
    <div class="space-y-4 lg:grid lg:grid-cols-[240px_minmax(0,220px)_minmax(0,1fr)] lg:items-start lg:gap-4 lg:space-y-0">
      <div class="grid grid-cols-[minmax(0,42vw)_minmax(0,1fr)] items-start gap-4 lg:contents">
        <JacketImage
          source={jacketUrl() ?? undefined}
          alt={`${props.title}のジャケット`}
          class="block aspect-square w-full overflow-hidden rounded-md border border-border bg-surface"
          imageClass="h-full w-full object-cover"
          fallback={
            <img
              src={placeholderImageUrl}
              alt={`${props.title}のジャケット（フォールバック）`}
              class="h-full w-full object-cover"
            />
          }
        />

        <div class="relative grid gap-2 rounded-md border border-border bg-surface p-4">
          {props.infoAction}
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

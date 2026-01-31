import * as Tabs from '@kobalte/core/tabs'
import { Image } from 'lucide-solid'
import type { Component } from 'solid-js'
import { For } from 'solid-js'
import { ScrollToTop } from '../../../components'
import type {
  HonorDTO,
  PlayerDTO,
  PlayerRecordDTO,
  UserProfileWithRecordsDTO,
} from '../../../types/api'
import { UserNameplate } from './components/UserNameplate'
import { UserRecordCard } from './components/UserRecordCard'

type Props = {
  profile: UserProfileWithRecordsDTO
}

const RecordList: Component<{ records: PlayerRecordDTO[] }> = (props) => (
  <div class="mx-4 flex flex-col gap-2">
    <For each={props.records}>
      {(record, i) => <UserRecordCard record={record} index={i()} />}
    </For>
  </div>
)

export const UserProfileView: Component<Props> = (props) => {
  const { profile } = props
  const playerInfo: PlayerDTO = profile.player
  const honors: HonorDTO[] = playerInfo.honors

  const bestRecords: PlayerRecordDTO[] = profile.records.best
  const newRecords: PlayerRecordDTO[] = profile.records.new

  // ネームプレートの高さ+マージン(タブ切り替え時の自動スクロール用)
  const NAMEPLATE_SCROLL_OFFSET = 183

  return (
    // 2カラムレイアウト(PCのみ)
    <div class="md:flex md:gap-0 md:divide-x-4 md:divide-gray-300 md:h-screen">
      {/* 左側 */}
      {/* sticy scrollの関係でmb-4とmt-4の付与位置を分けています */}
      <div class="mb-4 overflow-y-auto h-screen md:w-106.25 md:shrink-0 md:h-full" id="user-profile">
        <div class="mt-4">
          {/* ネームプレート */}
          <UserNameplate
            playerInfo={playerInfo}
            honors={honors}
            bestRecords={bestRecords}
            newRecords={newRecords}
          />
        </div>

        <Tabs.Root
          class="mb-4"
          // タブを切り替えた際に1曲目の位置までスクロールする
          onChange={() => {
            let scrollTarget: HTMLElement | null = null
            if (window.matchMedia('(min-width: 768px)').matches) {
              scrollTarget = document.getElementById('user-profile')
            } else {
              scrollTarget = document.querySelector('main')
            }
            if (scrollTarget && scrollTarget.scrollTop > NAMEPLATE_SCROLL_OFFSET) {
              scrollTarget.scrollTo({
                top: NAMEPLATE_SCROLL_OFFSET,
                behavior: 'smooth',
              })
            }
          }}
        >
          <Tabs.List class="sticky top-0 z-10 bg-white flex gap-2 mb-4 px-4 pt-2 border-b border-gray-300">
            <Tabs.Trigger
              value="best"
              class="px-3 py-1 rounded-t data-selected:bg-white data-selected:border-b-2 data-selected:border-blue-500"
            >
              ベスト枠
            </Tabs.Trigger>
            <Tabs.Trigger
              value="new"
              class="px-3 py-1 rounded-t data-selected:bg-white data-selected:border-b-2 data-selected:border-blue-500"
            >
              新曲枠
            </Tabs.Trigger>
            <div class="flex-1"></div>
            <button type="button" class="px-3 py-1 mb-1 bg-blue-500 text-white rounded-md">
              <Image class="inline-block mr-1 mb-0.5" size={16} />
              画像化
            </button>
          </Tabs.List>
          <Tabs.Content value="best">
            <RecordList records={bestRecords} />
          </Tabs.Content>
          <Tabs.Content value="new">
            <RecordList records={newRecords} />
          </Tabs.Content>
        </Tabs.Root>

        {/* スクロールトップボタン（モバイル用） */}
        <div class="md:hidden">
          <ScrollToTop />
        </div>
      </div>
      {/* 右側 */}
      <div class="hidden md:block md:flex-1 md:h-screen md:overflow-y-auto"></div>
    </div>
  )
}

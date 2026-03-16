import * as Tabs from '@kobalte/core/tabs'
import type { Component } from 'solid-js'
import { For, lazy, Suspense } from 'solid-js'
import { Loading, ScrollToTop } from '../../../components'
import type {
  HonorDTO,
  PlayerDTO,
  PlayerRecordDTO,
  UserProfileWithRecordsDTO,
} from '../../../types/api'
import { UserNameplate } from './components/UserNameplate'
import { UserRecordCard } from './components/UserRecordCard'

const UserRecord = lazy(() => import('../UserRecord'))

type Props = {
  profile: UserProfileWithRecordsDTO
}

const RecordList: Component<{ records: PlayerRecordDTO[] }> = (props) => (
  <div class="mx-4 flex flex-col gap-2">
    <For each={props.records}>{(record, i) => <UserRecordCard record={record} index={i()} />}</For>
  </div>
)

export const UserProfileView: Component<Props> = (props) => {
  const playerInfo = (): PlayerDTO => props.profile.player
  const honors = (): HonorDTO[] => playerInfo().honors
  const bestRecords = (): PlayerRecordDTO[] => props.profile.records.best
  const newRecords = (): PlayerRecordDTO[] => props.profile.records.new

  // ネームプレートの高さ+マージン(タブ切り替え時の自動スクロール用)
  const NAMEPLATE_SCROLL_OFFSET = 183
  const tabTriggerClass =
    'px-3 py-1 rounded-t data-selected:bg-white data-selected:border-b-2 data-selected:border-primary-500'
  const ratingTabTriggerClass =
    'rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors data-selected:bg-primary-600 data-selected:text-white data-selected:shadow-sm'

  const scrollToRecordList = () => {
    const scrollTarget = document.getElementById('app-main')
    if (scrollTarget && scrollTarget.scrollTop > NAMEPLATE_SCROLL_OFFSET) {
      scrollTarget.scrollTo({
        top: NAMEPLATE_SCROLL_OFFSET,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div class="mb-4 mx-auto w-full max-w-3xl">
      {/* ↑と↓について: stickyScrollの関係でmy-4を使わず、mb-4とmt-4を別の箇所で指定しています */}
      <div class="mt-4">
        {/* ネームプレート */}
        <UserNameplate
          playerInfo={playerInfo()}
          honors={honors()}
          bestRecords={bestRecords()}
          newRecords={newRecords()}
        />
      </div>

      <Tabs.Root
        defaultValue="rating"
        class="mb-4"
        // タブを切り替えた際に1曲目の位置までスクロールする
        onChange={scrollToRecordList}
      >
        <Tabs.List class="sticky top-0 z-10 bg-white flex gap-2 mb-4 px-4 pt-2 border-b border-gray-300">
          <Tabs.Trigger value="rating" class={tabTriggerClass}>
            レーティング
          </Tabs.Trigger>
          <Tabs.Trigger value="records" class={tabTriggerClass}>
            レコード
          </Tabs.Trigger>
          <div class="flex-1"></div>
        </Tabs.List>

        <Tabs.Content value="rating">
          <Tabs.Root defaultValue="best" onChange={scrollToRecordList}>
            <Tabs.List class="mb-4 mx-4 inline-flex gap-1 rounded-xl bg-gray-100 p-1">
              <Tabs.Trigger value="best" class={ratingTabTriggerClass}>
                ベスト枠
              </Tabs.Trigger>
              <Tabs.Trigger value="new" class={ratingTabTriggerClass}>
                新曲枠
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="best">
              <RecordList records={bestRecords()} />
            </Tabs.Content>
            <Tabs.Content value="new">
              <RecordList records={newRecords()} />
            </Tabs.Content>
          </Tabs.Root>
        </Tabs.Content>

        <Tabs.Content value="records">
          <Suspense fallback={<Loading />}>
            <UserRecord />
          </Suspense>
        </Tabs.Content>
      </Tabs.Root>

      {/* スクロールトップボタン（モバイル用） */}
      <div class="md:hidden">
        <ScrollToTop />
      </div>
    </div>
  )
}

import type { JSX } from 'solid-js'
import { ErrorBoundary, Show } from 'solid-js'
import { LoadError, Loading } from '../../../components'
import { getSongDetailViewState } from './songDetailLayoutModel'

type Props<TSong> = {
  song: TSong | undefined
  isSongLoading: boolean
  songErrorMessage?: string
  title: string
  artist: string
  onBack: () => void
  renderInfoCard: (song: TSong) => JSX.Element
  renderStats: (song: TSong) => JSX.Element
}

/**
 * 楽曲詳細画面の共通レイアウトを表示する。
 *
 * @param props - 楽曲詳細の表示状態と描画関数。
 * @returns 楽曲詳細画面の共通レイアウト。
 */
const SongDetailLayout = <TSong,>(props: Props<TSong>) => {
  const viewState = () => getSongDetailViewState(Boolean(props.song), props.isSongLoading)

  return (
    <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
      <Show
        when={viewState() === 'content' && props.song}
        fallback={
          <Show
            when={viewState() === 'loading'}
            fallback={<LoadError error={props.songErrorMessage} />}
          >
            <Loading />
          </Show>
        }
      >
        {(songData) => (
          <div class="mx-auto w-full max-w-6xl space-y-4 p-4">
            <div class="text-sm">
              <button
                type="button"
                onClick={props.onBack}
                class="cursor-pointer border-0 bg-transparent p-0 text-action-primary hover:underline"
              >
                ← 戻る
              </button>
            </div>

            <div class="space-y-1">
              <h1 class="mb-1 font-sans text-2xl font-semibold">{props.title}</h1>
              <div class="font-sans text-text-muted">{props.artist}</div>
            </div>

            {props.renderInfoCard(songData())}
            {props.renderStats(songData())}
          </div>
        )}
      </Show>
    </ErrorBoundary>
  )
}

export default SongDetailLayout

import { Button } from '@kobalte/core/button'
import { Link } from '@kobalte/core/link'
import { ExternalLink } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { ErrorBoundary, Show } from 'solid-js'
import { LoadError, Loading } from '../../../components'
import { getAppButtonClass } from '../../../components/common/AppButton'
import { WIKI_BASE_URL } from '../../../config'
import { buildWikiPageUrl } from '../../../utils/wiki'
import { buildSongYoutubeSearchUrl } from '../../../utils/youtube'
import { SONG_DETAIL_LINK_COPY } from '../constants'
import { getSongDetailViewState } from './songDetailLayoutModel'

type Props<TSong> = {
  song: TSong | undefined
  isSongLoading: boolean
  songErrorMessage?: string
  title: string
  artist: string
  /** Wikiのページタイトル。未設定の場合はWikiリンクを表示しない */
  wikiPageTitle?: string | null
  onBack: () => void
  renderInfoCard: (song: TSong) => JSX.Element
  renderStats: (song: TSong) => JSX.Element
}

type SongDetailExternalLinkProps = {
  /** リンク先URL */
  href: string
  /** ボタンに表示する文言 */
  label: string
  /** 支援技術向けのリンク説明 */
  ariaLabel: string
}

/**
 * 楽曲詳細の外部サイトへのリンクボタンを表示する。
 *
 * @param props - リンク先URLと表示文言。
 * @returns 新しいタブで外部サイトを開くリンクボタン。
 */
const SongDetailExternalLink = (props: SongDetailExternalLinkProps) => (
  <Link
    href={props.href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={props.ariaLabel}
    class={getAppButtonClass({ variant: 'surface', size: 'md', class: 'font-semibold' })}
  >
    {props.label}
    <ExternalLink class="h-4 w-4" aria-hidden="true" />
  </Link>
)

/**
 * 楽曲詳細画面の共通レイアウトを表示する。
 *
 * @param props - 楽曲詳細の表示状態と描画関数。
 * @returns 楽曲詳細画面の共通レイアウト。
 */
const SongDetailLayout = <TSong,>(props: Props<TSong>) => {
  const viewState = () => getSongDetailViewState(Boolean(props.song), props.isSongLoading)
  const wikiPageUrl = () => buildWikiPageUrl(WIKI_BASE_URL, props.wikiPageTitle)
  const youtubeSearchUrl = () => buildSongYoutubeSearchUrl(props.title)

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
              <Button
                type="button"
                onClick={props.onBack}
                class="cursor-pointer border-0 bg-transparent p-0 text-action-primary hover:underline"
              >
                ← 戻る
              </Button>
            </div>

            <div class="space-y-1">
              <h1 class="mb-1 font-sans text-2xl font-semibold">{props.title}</h1>
              <div class="font-sans text-text-muted">{props.artist}</div>
              <div class="mt-2 flex flex-wrap gap-2">
                <Show when={wikiPageUrl()}>
                  {(url) => (
                    <SongDetailExternalLink
                      href={url()}
                      label={SONG_DETAIL_LINK_COPY.wiki}
                      ariaLabel={SONG_DETAIL_LINK_COPY.wikiAriaLabel}
                    />
                  )}
                </Show>
                <SongDetailExternalLink
                  href={youtubeSearchUrl()}
                  label={SONG_DETAIL_LINK_COPY.youtube}
                  ariaLabel={SONG_DETAIL_LINK_COPY.youtubeAriaLabel}
                />
              </div>
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

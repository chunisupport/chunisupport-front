import { A } from '@solidjs/router'

type SongListTitleCellProps = {
  href: string
  title: string
  class: string
}

type SongListArtistCellProps = {
  artist: string
  class: string
}

type SongListGenreCellProps = {
  genre: string | null
  class: string
}

type SongListBpmCellProps = {
  bpm: number | null
  class: string
}

type SongListAddedDateCellProps = {
  release: string | null
  class: string
}

const formatAddedDate = (release: string | null): string => {
  if (!release) return '-'

  const matched = release.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!matched) return '-'

  const [, year, month, day] = matched
  return `${year.slice(-2)}/${month}/${day}`
}

/**
 * 楽曲一覧テーブルのセル全体をリンクにしたタイトルセルを描画する。
 *
 * @param props - 遷移先、楽曲タイトル、セルのスタイル情報。
 * @returns セル全体で楽曲詳細へ遷移できるタイトルセル。
 */
export const SongListTitleCell = (props: SongListTitleCellProps) => (
  <td class={`${props.class} relative`}>
    <A
      href={props.href}
      class="absolute inset-0 flex min-w-0 items-center px-3 font-sans text-song-list-title hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset"
      title={props.title}
    >
      <span class="min-w-0 truncate">{props.title}</span>
    </A>
  </td>
)

/**
 * 楽曲一覧テーブルのアーティスト名セルを描画する。
 * @param props アーティスト名とセルのスタイル情報。
 * @returns アーティスト名セル。
 */
export const SongListArtistCell = (props: SongListArtistCellProps) => (
  <td class={props.class}>
    <span class="block min-w-0 truncate font-sans" title={props.artist}>
      {props.artist}
    </span>
  </td>
)

export const SongListGenreCell = (props: SongListGenreCellProps) => (
  <td class={props.class}>
    <span class="block w-full truncate text-center" title={props.genre ?? '-'}>
      {props.genre ?? '-'}
    </span>
  </td>
)

export const SongListBpmCell = (props: SongListBpmCellProps) => (
  <td class={props.class}>{props.bpm ?? '-'}</td>
)

export const SongListAddedDateCell = (props: SongListAddedDateCellProps) => (
  <td class={props.class}>{formatAddedDate(props.release)}</td>
)

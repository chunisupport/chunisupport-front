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

export const SongListTitleCell = (props: SongListTitleCellProps) => (
  <td class={props.class}>
    <A
      href={props.href}
      class="block min-w-0 truncate font-sans text-primary-600 hover:underline"
      title={props.title}
    >
      {props.title}
    </A>
  </td>
)

export const SongListArtistCell = (props: SongListArtistCellProps) => (
  <td class={props.class}>
    <span class="block min-w-0 truncate" title={props.artist}>
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

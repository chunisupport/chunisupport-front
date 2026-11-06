import type { SongDTO, VersionSummaryDTO } from '../../../../types/api'
import SongCardGrid from '../../components/SongCardGrid'
import SongCard from './SongCard'

type SongsCardGridProps = {
  songs: SongDTO[]
  /** 追加日からのバージョン解決に使う一覧 */
  versions: readonly VersionSummaryDTO[]
  /** 1行あたりの列数 */
  columnCount: number
  /** 仮想グリッド初回アタッチ時のスクロール位置 */
  initialScrollOffset?: number
}

/**
 * 通常楽曲カードを仮想化したグリッドとして表示する。
 *
 * @param props - 表示する楽曲、バージョン一覧、列数、初期スクロール位置。
 * @returns 仮想スクロールするカードグリッド。
 */
const SongsCardGrid = (props: SongsCardGridProps) => {
  return (
    <SongCardGrid
      items={props.songs}
      columnCount={props.columnCount}
      initialScrollOffset={props.initialScrollOffset}
      renderCard={(song) => <SongCard song={song} versions={props.versions} />}
    />
  )
}

export default SongsCardGrid

import type { VersionSummaryDTO, WorldsendSongDTO } from '../../../../types/api'
import SongCardGrid from '../../components/SongCardGrid'
import WorldsendSongCard from './WorldsendSongCard'

type WorldsendSongsCardGridProps = {
  songs: WorldsendSongDTO[]
  /** 追加日からのバージョン解決に使う一覧 */
  versions: readonly VersionSummaryDTO[]
  /** 1行あたりの列数 */
  columnCount: number
  /** 仮想グリッド初回アタッチ時のスクロール位置 */
  initialScrollOffset?: number
}

/**
 * WORLD'S END 楽曲カードを仮想化したグリッドとして表示する。
 *
 * @param props - 表示する楽曲、バージョン一覧、列数、初期スクロール位置。
 * @returns 仮想スクロールするカードグリッド。
 */
const WorldsendSongsCardGrid = (props: WorldsendSongsCardGridProps) => {
  return (
    <SongCardGrid
      items={props.songs}
      columnCount={props.columnCount}
      initialScrollOffset={props.initialScrollOffset}
      renderCard={(song) => <WorldsendSongCard song={song} versions={props.versions} />}
    />
  )
}

export default WorldsendSongsCardGrid

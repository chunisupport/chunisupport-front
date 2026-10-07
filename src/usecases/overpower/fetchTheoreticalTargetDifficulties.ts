import { fetchMasterData, fetchVersions } from '../../api/songs'
import type { PlayerDataDifficulty } from '../../types/api'
import type {
  PlayerStatsNotesBySongId,
  PlayerStatsRecordAttribute,
} from '../../utils/playerStatsDashboard'
import { buildTheoreticalOverPowerTargetDifficultyBySongId } from '../../utils/theoreticalOverPowerTarget'
import {
  filterReleasedVersions,
  getShortVersionName,
  resolveVersionNameByReleaseDate,
} from '../../utils/versionConverter'
import { fetchAllSongsWithCache } from '../cache/fetchAllSongsWithCache'

/** 統計ダッシュボードで使う曲別の譜面情報 */
export type PlayerStatsChartMetadata = {
  targetDifficultyBySongId: Map<string, PlayerDataDifficulty>
  notesBySongId: PlayerStatsNotesBySongId
  /** 曲IDごとのジャンル・追加バージョンと、APIが判定した名前順フォルダ */
  attributesBySongId: ReadonlyMap<string, PlayerStatsRecordAttribute & { nameFolder: string }>
  genres: string[]
  versions: string[]
  /** APIマスタの表示順に並べた名前順フォルダのコード */
  nameFolders: string[]
  /** 集計用の名称・コードからAPIの短縮名・表示名への対応 */
  shortNames: {
    genre: ReadonlyMap<string, string>
    version: ReadonlyMap<string, string>
    nameFolder: ReadonlyMap<string, string>
  }
}

/**
 * 楽曲マスタをカプセル化し、統計ダッシュボード用の譜面情報を取得する。
 *
 * @returns 曲IDごとの譜面情報と名前順フォルダ、フィルター用のジャンル・バージョン一覧、表示順のフォルダ一覧と表示名。
 */
export const fetchPlayerStatsChartMetadata = async (): Promise<PlayerStatsChartMetadata> => {
  const [{ songs }, masterData, versionData] = await Promise.all([
    fetchAllSongsWithCache(),
    fetchMasterData(),
    fetchVersions(),
  ])
  return {
    targetDifficultyBySongId: buildTheoreticalOverPowerTargetDifficultyBySongId(songs),
    notesBySongId: new Map(
      songs.map((song) => [
        song.id,
        Object.fromEntries(
          Object.entries(song.charts).flatMap(([difficulty, chart]) =>
            chart ? [[difficulty, chart.notes]] : []
          )
        ),
      ])
    ),
    attributesBySongId: new Map(
      songs.map((song) => [
        song.id,
        {
          genre: song.genre,
          version: getShortVersionName(
            resolveVersionNameByReleaseDate(song.release, versionData.versions)
          ),
          nameFolder: song.name_folder_code,
        },
      ])
    ),
    nameFolders: masterData.name_folders.map((folder) => folder.code),
    shortNames: {
      nameFolder: new Map(masterData.name_folders.map((folder) => [folder.code, folder.name])),
      genre: new Map(masterData.genres.map((genre) => [genre.name, genre.short_name])),
      version: new Map(
        versionData.versions.map((version) => [
          getShortVersionName(version.name),
          version.short_name,
        ])
      ),
    },
    genres: masterData.genres.map((genre) => genre.name),
    versions: filterReleasedVersions(versionData.versions).map((version) =>
      getShortVersionName(version.name)
    ),
  }
}

/**
 * 楽曲マスタをカプセル化し、曲IDごとの理論値OVER POWER対象難易度を取得する。
 *
 * @returns 理論値対象難易度が設定された曲だけを保持するMap。
 */
export const fetchTheoreticalTargetDifficultyBySongId = async (): Promise<
  Map<string, PlayerDataDifficulty>
> => {
  const { songs } = await fetchAllSongsWithCache()
  return buildTheoreticalOverPowerTargetDifficultyBySongId(songs)
}

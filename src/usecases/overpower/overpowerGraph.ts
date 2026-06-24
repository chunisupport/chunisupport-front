import type { PlayerRecordDTO, SongDTO } from '../../types/api'
import type { OverPowerDifficulty, OverPowerLockedSong } from './types'

const DIFFICULTY_ORDER: OverPowerDifficulty[] = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA']
const ULTIMA_DIFFICULTY: OverPowerDifficulty = 'ULTIMA'

/** 未解禁設定をOVER POWERグラフ集計で参照するための検索セット。 */
type LockedSongLookup = {
  /** 通常未解禁として曲ごと除外する楽曲ID一覧。 */
  lockedSongIds: Set<string>
  /** ULTIMA未解禁としてULTIMA譜面だけ除外する楽曲ID一覧。 */
  ultimaLockedSongIds: Set<string>
}

/** OVER POWERグラフで理論値最大譜面として扱う譜面情報。 */
type TargetChart = {
  /** 理論値最大譜面の難易度。 */
  difficulty: OverPowerDifficulty
  /** 理論値OVER POWERの比較に使う譜面定数。 */
  chartConst: number
}

/**
 * 未解禁設定をグラフ集計用の検索セットへ変換する。
 *
 * @param lockedSongs - ユーザーが未解禁として設定した楽曲一覧。
 * @returns 通常未解禁とULTIMA未解禁を分けて保持する検索セット。
 */
export const buildOverPowerLockedSongLookup = (
  lockedSongs: OverPowerLockedSong[]
): LockedSongLookup => {
  const lockedSongIds = new Set<string>()
  const ultimaLockedSongIds = new Set<string>()

  for (const lockedSong of lockedSongs) {
    if (lockedSong.is_ultima) {
      ultimaLockedSongIds.add(lockedSong.display_id)
    } else {
      lockedSongIds.add(lockedSong.display_id)
    }
  }

  return { lockedSongIds, ultimaLockedSongIds }
}

/**
 * OVER POWERグラフで参照する理論値最大の譜面を取得する。
 *
 * @param song - 対象楽曲。
 * @param lockedLookup - 未解禁設定の検索セット。
 * @returns 利用可能な譜面のうち理論値OVER POWERが最大の譜面。譜面がない場合はnull。
 */
const getHighestTheoreticalChart = (
  song: SongDTO,
  lockedLookup: LockedSongLookup
): TargetChart | null => {
  const chartEntries = Object.entries(song.charts) as [
    OverPowerDifficulty,
    SongDTO['charts'][OverPowerDifficulty],
  ][]
  let target: TargetChart | null = null

  for (const [difficulty, chart] of chartEntries) {
    if (!chart) continue
    if (difficulty === ULTIMA_DIFFICULTY && lockedLookup.ultimaLockedSongIds.has(song.id)) continue

    const currentChart: TargetChart = { difficulty, chartConst: chart.const }
    if (
      !target ||
      currentChart.chartConst > target.chartConst ||
      (currentChart.chartConst === target.chartConst &&
        DIFFICULTY_ORDER.indexOf(currentChart.difficulty) >
          DIFFICULTY_ORDER.indexOf(target.difficulty))
    ) {
      target = currentChart
    }
  }

  return target
}

/**
 * ALL・ジャンル・バージョングラフ向けに、曲ごとの理論値最大譜面に対応するレコードを選択する。
 *
 * @param songs - 集計対象の楽曲一覧。
 * @param records - 未解禁設定で除外済みのプレイヤーレコード一覧。
 * @param lockedLookup - 未解禁設定の検索セット。
 * @returns 曲IDをキーに、理論値最大譜面のレコードまたは未プレイを表すnullを保持するMap。
 */
export const buildTheoreticalTargetRecordBySongId = (
  songs: SongDTO[],
  records: PlayerRecordDTO[],
  lockedLookup: LockedSongLookup
): Map<string, PlayerRecordDTO | null> => {
  const recordBySongAndDifficulty = new Map<string, PlayerRecordDTO>()

  for (const record of records) {
    recordBySongAndDifficulty.set(`${record.id}:${record.difficulty}`, record)
  }

  const targetRecordBySongId = new Map<string, PlayerRecordDTO | null>()
  for (const song of songs) {
    if (lockedLookup.lockedSongIds.has(song.id)) continue

    const targetChart = getHighestTheoreticalChart(song, lockedLookup)
    if (!targetChart) continue

    targetRecordBySongId.set(
      song.id,
      recordBySongAndDifficulty.get(`${song.id}:${targetChart.difficulty}`) ?? null
    )
  }

  return targetRecordBySongId
}

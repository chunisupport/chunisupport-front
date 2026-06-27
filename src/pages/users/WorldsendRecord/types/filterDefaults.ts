import {
  SCORE_MIN,
  WORLDSEND_LEVEL_STAR_MAX,
  WORLDSEND_LEVEL_STAR_MIN,
} from '../../../../constants/chart'
import type { VersionSummaryDTO, WorldsendSongDTO } from '../../../../types/api'
import { MAX_SCORE } from '../../../../utils/scoreRank'
import { getShortVersionName } from '../../../../utils/versionConverter'
import {
  RECORD_CHAIN_LAMP_OPTIONS,
  RECORD_COMBO_LAMP_OPTIONS,
  RECORD_HARD_LAMP_OPTIONS,
} from '../../constants/recordFilterOptions'
import type { WorldsendFilterState } from './filterTypes'

/** WORLD'S END フィルターの初期値。 */
export const DEFAULT_WORLDSEND_FILTER: WorldsendFilterState = {
  title: '',
  attributes: [],
  levelStarRange: {
    min: WORLDSEND_LEVEL_STAR_MIN,
    max: WORLDSEND_LEVEL_STAR_MAX,
  },
  genres: [],
  versions: [],
  score: {
    min: SCORE_MIN,
    max: MAX_SCORE,
  },
  scoreFilterMode: 'rank',
  justiceCount: {
    min: null,
    max: null,
  },
  combo_lamp: [...RECORD_COMBO_LAMP_OPTIONS],
  chain_lamp: [...RECORD_CHAIN_LAMP_OPTIONS],
  hard_lamp: [...RECORD_HARD_LAMP_OPTIONS],
  excludeNoPlay: false,
}

/**
 * WORLD'S END 楽曲マスタからフィルターの初期選択肢を生成する。
 *
 * @param songs - WORLD'S END 楽曲マスタ。
 * @returns ジャンル、バージョン、属性を全選択した初期値。
 */
export const getWorldsendSongDefaults = (
  songs: WorldsendSongDTO[],
  versionSummaries: VersionSummaryDTO[] = []
) => {
  const genres = Array.from(
    new Set(songs.map((song) => song.genre).filter((genre): genre is string => Boolean(genre)))
  ).sort((left, right) => left.localeCompare(right, 'ja'))
  const releaseVersions = versionSummaries.map((version) => getShortVersionName(version.name))
  const attributes = Array.from(
    new Set(songs.map((song) => song.charts.WORLDSEND?.attribute ?? null))
  ).sort((left, right) => (left ?? '').localeCompare(right ?? '', 'ja'))

  return { genres, versions: releaseVersions, attributes }
}

/**
 * WORLD'S END フィルターの初期値を生成する。
 *
 * @param songs - WORLD'S END 楽曲マスタ。
 * @returns 楽曲マスタ由来の選択肢を反映したフィルター初期値。
 */
export const buildDefaultWorldsendFilter = (
  songs: WorldsendSongDTO[] = [],
  versions: VersionSummaryDTO[] = []
): WorldsendFilterState => {
  const defaults = getWorldsendSongDefaults(songs, versions)

  return {
    ...DEFAULT_WORLDSEND_FILTER,
    ...defaults,
    score: { ...DEFAULT_WORLDSEND_FILTER.score },
    justiceCount: { ...DEFAULT_WORLDSEND_FILTER.justiceCount },
    levelStarRange: { ...DEFAULT_WORLDSEND_FILTER.levelStarRange },
    combo_lamp: [...RECORD_COMBO_LAMP_OPTIONS],
    chain_lamp: [...RECORD_CHAIN_LAMP_OPTIONS],
    hard_lamp: [...RECORD_HARD_LAMP_OPTIONS],
  }
}

/**
 * 保存値などの部分的な WORLD'S END フィルターを現行スキーマへ補完する。
 *
 * @param filter - 補完対象のフィルター。
 * @returns 現行フィールドをすべて持つ WORLD'S END フィルター。
 */
export const normalizeWorldsendFilterState = (
  filter: Partial<WorldsendFilterState>
): WorldsendFilterState => ({
  ...DEFAULT_WORLDSEND_FILTER,
  ...filter,
  score: filter.score ?? { ...DEFAULT_WORLDSEND_FILTER.score },
  justiceCount: filter.justiceCount ?? { ...DEFAULT_WORLDSEND_FILTER.justiceCount },
  attributes: filter.attributes ?? [...DEFAULT_WORLDSEND_FILTER.attributes],
  levelStarRange: filter.levelStarRange ?? { ...DEFAULT_WORLDSEND_FILTER.levelStarRange },
  combo_lamp: filter.combo_lamp ?? [...RECORD_COMBO_LAMP_OPTIONS],
  chain_lamp: filter.chain_lamp ?? [...RECORD_CHAIN_LAMP_OPTIONS],
  hard_lamp: filter.hard_lamp ?? [...RECORD_HARD_LAMP_OPTIONS],
})

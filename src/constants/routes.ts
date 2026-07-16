export const LOGIN_PATH = '/login'
export const REGISTER_PATH = '/register'
export const REGISTER_SCORE_PATH = '/register-score'
export const REGISTER_SCORE_TEMP_PATH = '/register-score-temp'
export const REGISTER_SCORE_MOCK_PATH = '/register-score-mock'
/** 保存済みの最新スコア更新結果画面のパス。 */
export const LATEST_SCORE_UPDATE_PATH = '/latest-score-update'
export const TOOLS_PATH = '/tools'
/** フレンド画面のパス。 */
export const FRIENDS_PATH = '/friends'
export const CHART_CONSTANT_CALCULATOR_PATH = `${TOOLS_PATH}/chart-constant-calculator`
export const BORDER_CALCULATOR_PATH = `${TOOLS_PATH}/border-calculator`
export const WEAK_CHART_INSPECTOR_PATH = `${TOOLS_PATH}/weak-chart-inspector`
export const RANDOM_SONG_SELECTOR_PATH = `${TOOLS_PATH}/random-song-selector`
/** ベスト枠ランキング画面のパス。 */
export const BEST_SLOT_RANKING_PATH = `${TOOLS_PATH}/best-slot-ranking`
export const LOCKED_SONGS_FINDER_PATH = `${TOOLS_PATH}/locked-songs-finder`
/** EDITOR向け楽曲編集画面のパス。 */
export const EDITOR_SONGS_PATH = '/editor/songs'

/** 楽曲詳細から譜面詳細へ遷移したことを表すルーター state。 */
export const CHART_DETAIL_FROM_SONG_DETAIL_STATE = {
  source: 'song-detail',
} as const

/**
 * 通常楽曲詳細画面パスを生成する。
 *
 * @param displayId - 楽曲表示ID。
 * @param difficulty - 初期選択する難易度ドメイン値。
 * @returns 通常楽曲詳細画面パス。
 */
export const buildSongDetailPath = (displayId: string, difficulty?: string): string => {
  const path = `/songs/${encodeURIComponent(displayId)}`
  if (!difficulty) return path

  return `${path}?${new URLSearchParams({ diff: difficulty.toLowerCase() }).toString()}`
}

/**
 * WORLD'S END 楽曲詳細画面パスを生成する。
 *
 * @param displayId - 楽曲表示ID。
 * @returns WORLD'S END 楽曲詳細画面パス。
 */
export const buildWorldsendSongDetailPath = (displayId: string): string =>
  `/songs/worldsend/${encodeURIComponent(displayId)}`

/**
 * 楽曲詳細から譜面詳細へ遷移した state か判定する。
 *
 * @param value - ルーター location state。
 * @returns 楽曲詳細からの遷移 state の場合は true。
 */
export const isChartDetailFromSongDetailState = (
  value: unknown
): value is typeof CHART_DETAIL_FROM_SONG_DETAIL_STATE =>
  typeof value === 'object' &&
  value !== null &&
  'source' in value &&
  value.source === CHART_DETAIL_FROM_SONG_DETAIL_STATE.source

/**
 * 通常譜面の譜面詳細画面パスを生成する。
 *
 * @param displayId - 楽曲表示ID。
 * @param difficulty - 大文字の難易度ドメイン値。
 * @returns 難易度クエリを含む譜面詳細画面パス。
 */
export const buildSongChartDetailPath = (displayId: string, difficulty: string): string =>
  `/songs/${encodeURIComponent(displayId)}/chart-detail?${new URLSearchParams({
    diff: difficulty.toLowerCase(),
  }).toString()}`

/**
 * WORLD'S END の譜面詳細画面パスを生成する。
 *
 * @param displayId - 楽曲表示ID。
 * @returns WORLD'S END 譜面詳細画面パス。
 */
export const buildWorldsendChartDetailPath = (displayId: string): string =>
  `/songs/worldsend/${encodeURIComponent(displayId)}/chart-detail`

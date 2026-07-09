export const LOGIN_PATH = '/login'
export const REGISTER_PATH = '/register'
export const REGISTER_SCORE_PATH = '/register-score'
export const REGISTER_SCORE_TEMP_PATH = '/register-score-temp'
export const TOOLS_PATH = '/tools'
/** フレンド画面のパス。 */
export const FRIENDS_PATH = '/friends'
export const CHART_CONSTANT_CALCULATOR_PATH = `${TOOLS_PATH}/chart-constant-calculator`
export const BORDER_CALCULATOR_PATH = `${TOOLS_PATH}/border-calculator`
export const WEAK_CHART_INSPECTOR_PATH = `${TOOLS_PATH}/weak-chart-inspector`
export const RANDOM_SONG_SELECTOR_PATH = `${TOOLS_PATH}/random-song-selector`
export const LOCKED_SONGS_FINDER_PATH = `${TOOLS_PATH}/locked-songs-finder`
/** EDITOR向け楽曲編集画面のパス。 */
export const EDITOR_SONGS_PATH = '/editor/songs'

/** 楽曲詳細からスコア履歴へ遷移したことを表すルーター state。 */
export const SCORE_HISTORY_FROM_SONG_DETAIL_STATE = {
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
 * 楽曲詳細からスコア履歴へ遷移した state か判定する。
 *
 * @param value - ルーター location state。
 * @returns 楽曲詳細からの遷移 state の場合は true。
 */
export const isScoreHistoryFromSongDetailState = (
  value: unknown
): value is typeof SCORE_HISTORY_FROM_SONG_DETAIL_STATE =>
  typeof value === 'object' &&
  value !== null &&
  'source' in value &&
  value.source === SCORE_HISTORY_FROM_SONG_DETAIL_STATE.source

/**
 * 通常譜面のスコア履歴画面パスを生成する。
 *
 * @param displayId - 楽曲表示ID。
 * @param difficulty - 大文字の難易度ドメイン値。
 * @returns 難易度クエリを含むスコア履歴画面パス。
 */
export const buildSongScoreHistoryPath = (displayId: string, difficulty: string): string =>
  `/songs/${encodeURIComponent(displayId)}/score-history?${new URLSearchParams({
    diff: difficulty.toLowerCase(),
  }).toString()}`

/**
 * WORLD'S END のスコア履歴画面パスを生成する。
 *
 * @param displayId - 楽曲表示ID。
 * @returns WORLD'S END スコア履歴画面パス。
 */
export const buildWorldsendScoreHistoryPath = (displayId: string): string =>
  `/songs/worldsend/${encodeURIComponent(displayId)}/score-history`

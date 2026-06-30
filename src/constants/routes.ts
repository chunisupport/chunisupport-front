export const LOGIN_PATH = '/login'
export const REGISTER_PATH = '/register'
export const REGISTER_SCORE_PATH = '/register-score'
export const REGISTER_SCORE_TEMP_PATH = '/register-score-temp'
export const TOOLS_PATH = '/tools'
export const CHART_CONSTANT_CALCULATOR_PATH = `${TOOLS_PATH}/chart-constant-calculator`
export const BORDER_CALCULATOR_PATH = `${TOOLS_PATH}/border-calculator`
export const WEAK_CHART_INSPECTOR_PATH = `${TOOLS_PATH}/weak-chart-inspector`
export const RANDOM_SONG_SELECTOR_PATH = `${TOOLS_PATH}/random-song-selector`
export const LOCKED_SONGS_FINDER_PATH = `${TOOLS_PATH}/locked-songs-finder`
/** EDITOR向け楽曲編集画面のパス。 */
export const EDITOR_SONGS_PATH = '/editor/songs'

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

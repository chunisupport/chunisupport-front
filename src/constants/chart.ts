/** 譜面定数として扱う最小値。 */
export const CHART_CONST_MIN = 1.0

/** 譜面定数として扱う最大値。 */
export const CHART_CONST_MAX = 16.0

/** 譜面定数を表示・入力するときの小数桁数。 */
export const CHART_CONST_DECIMAL_PLACES = 1

/** CHUNITHM のスコアとして扱う最小値。 */
export const SCORE_MIN = 0

/** レコードフィルターで許可する JUSTICE 数の最小値。 */
export const JUSTICE_COUNT_MIN = 0

/** レコードフィルターで許可する JUSTICE 数の最大値。 */
export const JUSTICE_COUNT_MAX = Number.MAX_SAFE_INTEGER

/** レコードフィルターで許可する OVER POWER の最小値。 */
export const OVER_POWER_MIN = 0

/** レコードフィルターで許可する OVER POWER の最大値。 */
export const OVER_POWER_MAX = (CHART_CONST_MAX + 3) * 5

/** WORLD'S END の星数レベルとして扱う最小値。 */
export const WORLDSEND_LEVEL_STAR_MIN = 1

/** WORLD'S END の星数レベルとして扱う最大値。 */
export const WORLDSEND_LEVEL_STAR_MAX = 5

/** WORLD'S END の星数レベル選択肢。 */
export const WORLDSEND_LEVEL_STAR_OPTIONS = Array.from(
  { length: WORLDSEND_LEVEL_STAR_MAX - WORLDSEND_LEVEL_STAR_MIN + 1 },
  (_, index) => WORLDSEND_LEVEL_STAR_MIN + index
)

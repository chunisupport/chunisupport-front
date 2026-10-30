import { SCORE_THEORETICAL_MAX } from '../constants/chart'
import { PLAYER_DATA_DIFFICULTIES } from '../constants/difficulty'
import type { PlayerRecordDTO } from '../types/api'
import type { ChartScoresResponse } from '../types/chartScores'
import { truncateChartConst } from './chartConstFormat'
import { compareRecordsWithRatingBand } from './onlineWeakChartInspector'
import { compareSongsByReading } from './songTitleSorting'
import type { SortDirection } from './sortingQuery'
import { isWeakChartInspectionTarget, quantile } from './weakChartInspector'

/** 自分の普段の失点比からのずれで決める判定。 */
export type UnifiedWeakChartCategory =
  | 'weakness'
  | 'mildWeakness'
  | 'normal'
  | 'strength'
  | 'unavailable'

/** 統合分析の譜面別信号。比較平均が欠ける譜面はずれと得意度を null にする。 */
export interface UnifiedWeakChartEntry {
  record: PlayerRecordDTO
  /** 普段の失点比からのずれを、近い譜面定数での失点比のばらつきで割った値。 */
  deviation: number | null
  /** ずれを偏差値形式（50が普段どおり）へ換算した整数の得意度。 */
  aptitude: number | null
  category: UnifiedWeakChartCategory
}

/** 見直す優先順位。比較不能な譜面は末尾に置く。 */
export const UNIFIED_WEAK_CHART_CATEGORIES: readonly UnifiedWeakChartCategory[] = [
  'weakness',
  'mildWeakness',
  'normal',
  'strength',
  'unavailable',
]

/** 普段の失点比を求める譜面定数の幅（前後それぞれ、0.1刻みの段数）。 */
const CONST_WINDOW_STEPS = 5

/** 定数の近い譜面がこの件数未満の場合は、比較できる全譜面で普段の失点比を求める。 */
const MIN_WINDOW_SIZE = 5

/** 中央絶対偏差を正規分布の標準偏差相当へ換算する係数。 */
const MAD_TO_SIGMA = 1.4826

/** 失点の下限点数。理論値付近で、数十点の差が大きな比にならないようにする。 */
const MIN_LOSS = 100

/** ばらつきの下限（失点比の自然対数）。失点比がほぼ揃った定数帯で、わずかなずれを過敏に判定しないようにする。 */
const MIN_SCALE = 0.1

/** 普段どおりの譜面の得意度。 */
const APTITUDE_CENTER = 50

/** ずれ1あたりの得意度の変化量。 */
const APTITUDE_PER_DEVIATION = 10

/** 得意度の下限。極端なずれで表示が振り切れないようにする。 */
const MIN_APTITUDE = 20

/** 得意度の上限。 */
const MAX_APTITUDE = 80

/** 得意度がこの値以下なら「苦手」とする。 */
const WEAKNESS_APTITUDE = 30

/** 得意度がこの値以下なら「やや苦手」とする。 */
const MILD_WEAKNESS_APTITUDE = 40

/** 得意度がこの値以上なら「得意」とする。 */
const STRENGTH_APTITUDE = 60

/** 普段の失点比とばらつき。 */
type LossRatioStats = { baseline: number; scale: number }

/**
 * 理論値からの失点を求める。
 * @param score - スコアまたは平均スコア。
 * @returns 理論値との差。下限点数以上にする。
 */
const toLoss = (score: number): number => Math.max(SCORE_THEORETICAL_MAX - score, MIN_LOSS)

/**
 * レート帯平均の失点に対する自分の失点の比を、自然対数で求める。
 *
 * 失点はおおよそミスの数に比例するため、比にすると高得点帯ほど点数が上がりにくいことと、
 * 譜面ごとのノーツ数の違い（1ミスあたりの失点の違い）を打ち消せる。
 *
 * @param score - 自分のスコア。
 * @param averageScore - レート帯の平均スコア。
 * @returns 平均より失点が少ないほど大きい値。失点が同じなら0。
 */
const toLossRatio = (score: number, averageScore: number): number =>
  Math.log(toLoss(averageScore) / toLoss(score))

/**
 * 失点比の中央値と、中央絶対偏差から求めたばらつきを算出する。
 * @param ratios - 1件以上の失点比（自然対数）。
 * @returns 中央値と標準偏差相当のばらつき。ばらつきは下限以上にする。
 */
const calculateLossRatioStats = (ratios: readonly number[]): LossRatioStats => {
  const sorted = [...ratios].sort((left, right) => left - right)
  const baseline = quantile(sorted, 0.5)
  const deviations = sorted
    .map((ratio) => Math.abs(ratio - baseline))
    .sort((left, right) => left - right)
  return { baseline, scale: Math.max(quantile(deviations, 0.5) * MAD_TO_SIGMA, MIN_SCALE) }
}

/**
 * ずれを偏差値形式の得意度へ換算する。
 * @param deviation - ばらつきで割ったずれ。
 * @returns 下限・上限内に収めた整数の得意度。
 */
const toAptitude = (deviation: number): number =>
  Math.min(
    Math.max(Math.round(APTITUDE_CENTER + deviation * APTITUDE_PER_DEVIATION), MIN_APTITUDE),
    MAX_APTITUDE
  )

/**
 * 得意度で判定する。表示する得意度と判定が食い違わないよう、丸めた後の値で比べる。
 * @param aptitude - 整数の得意度。
 * @returns 判定。
 */
const classifyAptitude = (aptitude: number): UnifiedWeakChartCategory => {
  if (aptitude <= WEAKNESS_APTITUDE) return 'weakness'
  if (aptitude <= MILD_WEAKNESS_APTITUDE) return 'mildWeakness'
  if (aptitude >= STRENGTH_APTITUDE) return 'strength'
  return 'normal'
}

/** 得意度の表示範囲と、普段どおりを表す中心。 */
export const UNIFIED_WEAK_CHART_APTITUDE_SCALE = {
  min: MIN_APTITUDE,
  max: MAX_APTITUDE,
  center: APTITUDE_CENTER,
} as const

/** 得意度は整数のため、判定の境界を0.5ずらすと、各判定の点が必ず対応する領域内に描かれる。 */
const ZONE_BOUNDARY_OFFSET = 0.5

/** グラフで背景を塗る判定の得意度範囲。範囲外の得意度は「ふつう」。 */
export interface UnifiedWeakChartZone {
  category: Exclude<UnifiedWeakChartCategory, 'normal' | 'unavailable'>
  /** 範囲の下端。下側に制限がない場合は負の無限大。 */
  from: number
  /** 範囲の上端。上側に制限がない場合は正の無限大。 */
  to: number
}

/** グラフで背景を塗る判定の得意度範囲。判定の閾値と同じ定数から作り、判定と食い違わないようにする。 */
export const UNIFIED_WEAK_CHART_ZONES: readonly UnifiedWeakChartZone[] = [
  {
    category: 'weakness',
    from: Number.NEGATIVE_INFINITY,
    to: WEAKNESS_APTITUDE + ZONE_BOUNDARY_OFFSET,
  },
  {
    category: 'mildWeakness',
    from: WEAKNESS_APTITUDE + ZONE_BOUNDARY_OFFSET,
    to: MILD_WEAKNESS_APTITUDE + ZONE_BOUNDARY_OFFSET,
  },
  {
    category: 'strength',
    from: STRENGTH_APTITUDE - ZONE_BOUNDARY_OFFSET,
    to: Number.POSITIVE_INFINITY,
  },
]

/** 散布図に描く、譜面定数と得意度の点。 */
export interface UnifiedWeakChartPoint {
  x: number
  y: number
  entry: UnifiedWeakChartEntry
}

/**
 * 統合分析の結果を、横軸が譜面定数、縦軸が得意度の散布図の点へ変換する。
 * 同じ定数・得意度の点が重ならないよう、横方向へ7段階にずらす。得意度がない譜面は描かない。
 * @param entries - 統合分析の結果。
 * @param jitter - 横方向へ1段ずらす譜面定数の幅。
 * @returns 得意度がある譜面の点。
 */
export const buildUnifiedWeakChartPoints = (
  entries: readonly UnifiedWeakChartEntry[],
  jitter: number
): UnifiedWeakChartPoint[] =>
  entries.flatMap((entry, index) =>
    entry.aptitude === null
      ? []
      : [{ x: entry.record.const + ((index % 7) - 3) * jitter, y: entry.aptitude, entry }]
  )

/** 得意度バーの中心位置（バー全体の幅に対する割合、%）。 */
const APTITUDE_BAR_CENTER_PERCENT = 50

/**
 * 得意度バーで、中心から得意度までを塗る範囲を求める。
 * @param aptitude - 下限・上限内の得意度。
 * @returns バー全体の幅に対する塗りの左端と幅（%）、塗りが中心から右へ伸びるか。
 */
export const toAptitudeBarSpan = (
  aptitude: number
): { left: number; width: number; towardRight: boolean } => {
  const width =
    (Math.abs(aptitude - APTITUDE_CENTER) / (MAX_APTITUDE - APTITUDE_CENTER)) *
    APTITUDE_BAR_CENTER_PERCENT
  const towardRight = aptitude >= APTITUDE_CENTER
  return {
    left: towardRight ? APTITUDE_BAR_CENTER_PERCENT : APTITUDE_BAR_CENTER_PERCENT - width,
    width,
    towardRight,
  }
}

/** 得意度の数値を塗りの内側に収められる、塗りの最小幅（バー全体の幅に対する割合、%）。 */
const APTITUDE_LABEL_INSIDE_MIN_WIDTH_PERCENT = 20

/**
 * 得意度の数値を、塗りの先端（中心から遠い側の端）のどこに置くかを求める。
 * 塗りが十分に長ければ先端の内側、短ければ先端の外側に置く。
 * @param aptitude - 下限・上限内の得意度。
 * @returns 先端の位置（バー全体の幅に対する %）、数値を先端より左に置くか、塗りの内側に置くか。
 */
export const toAptitudeLabelPlacement = (
  aptitude: number
): { anchor: number; beforeAnchor: boolean; inside: boolean } => {
  const span = toAptitudeBarSpan(aptitude)
  const inside = span.width >= APTITUDE_LABEL_INSIDE_MIN_WIDTH_PERCENT
  return {
    anchor: span.towardRight ? span.left + span.width : span.left,
    beforeAnchor: span.towardRight === inside,
    inside,
  }
}

/**
 * 譜面定数を0.1刻みの整数段へ変換する。
 * @param chartConst - 譜面定数。
 * @returns 小数第1位で切り捨てた定数の10倍。
 */
const toConstStep = (chartConst: number): number => Math.round(truncateChartConst(chartConst) * 10)

/**
 * レート帯平均との失点比を、自分の普段の失点比と比べて判定する。
 *
 * 近い譜面定数（前後0.5、判定する譜面自身を含む）の譜面で失点比の中央値を普段の失点比とし、
 * そこからのずれを中央絶対偏差によるばらつきで割り、偏差値形式の得意度に換算して判定する。
 * 自分の地力とレート帯のずれや、定数帯・スコア帯ごとのスコアの伸びにくさを打ち消せる。
 *
 * @param records - 選択した集計条件内の通常譜面レコード。比較平均の有無で絞り込まない。
 * @param snapshots - 難易度別のスコア統計。
 * @param ratingBand - 比較するレート帯。
 * @returns 優先順位順のプレイ済み譜面。平均欠損譜面も含む。
 */
export const inspectUnifiedWeakCharts = (
  records: readonly PlayerRecordDTO[],
  snapshots: readonly ChartScoresResponse[],
  ratingBand: string
): UnifiedWeakChartEntry[] => {
  const played = records.filter(isWeakChartInspectionTarget)
  const comparisons = compareRecordsWithRatingBand(played, snapshots, ratingBand).map((entry) => ({
    record: entry.record,
    ratio: toLossRatio(entry.record.score, entry.averageScore),
    step: toConstStep(entry.record.const),
  }))
  const comparisonByKey = new Map(
    comparisons.map((entry) => [`${entry.record.id}:${entry.record.difficulty}`, entry])
  )
  const statsByStep = new Map<number, LossRatioStats>()

  /**
   * 指定した定数段の近くにある譜面から普段の失点比を求める。同じ段は再計算しない。
   * @param step - 0.1刻みの定数段。
   * @returns 普段の失点比とばらつき。
   */
  const statsFor = (step: number): LossRatioStats => {
    const cached = statsByStep.get(step)
    if (cached) return cached
    const nearby = comparisons.filter(
      (comparison) => Math.abs(comparison.step - step) <= CONST_WINDOW_STEPS
    )
    const source = nearby.length >= MIN_WINDOW_SIZE ? nearby : comparisons
    const stats = calculateLossRatioStats(source.map(({ ratio }) => ratio))
    statsByStep.set(step, stats)
    return stats
  }

  return played
    .map((record): UnifiedWeakChartEntry => {
      const comparison = comparisonByKey.get(`${record.id}:${record.difficulty}`)
      if (!comparison) {
        return { record, deviation: null, aptitude: null, category: 'unavailable' }
      }
      const { baseline, scale } = statsFor(comparison.step)
      const deviation = (comparison.ratio - baseline) / scale
      const aptitude = toAptitude(deviation)
      return { record, deviation, aptitude, category: classifyAptitude(aptitude) }
    })
    .sort(
      (left, right) =>
        UNIFIED_WEAK_CHART_CATEGORIES.indexOf(left.category) -
          UNIFIED_WEAK_CHART_CATEGORIES.indexOf(right.category) ||
        (left.deviation ?? 0) - (right.deviation ?? 0) ||
        compareSongsByReading(left.record, right.record)
    )
}

/** 統合分析の比較表で利用できるソートキー。 */
export type UnifiedWeakChartSortKey =
  | 'title'
  | 'difficulty'
  | 'const'
  | 'score'
  | 'aptitude'
  | 'category'

/**
 * 統合分析の結果を指定列でソートする。
 *
 * 得意度がない譜面は、得意度で並べる場合にソート方向にかかわらず末尾に置く。
 * 判定列は判定の優先順で比べ、同じ判定内は入力順（ずれの小さい順）を保つ。
 *
 * @param entries - 優先順位順の統合分析結果。
 * @param sortKey - ソート対象列。未指定時は入力順を維持する。
 * @param sortDirection - ソート方向。未指定時は入力順を維持する。
 * @returns ソート済みの新しい配列。
 */
export const sortUnifiedWeakChartEntries = (
  entries: readonly UnifiedWeakChartEntry[],
  sortKey: UnifiedWeakChartSortKey | null,
  sortDirection: SortDirection | null
): UnifiedWeakChartEntry[] => {
  if (!sortKey || !sortDirection) return [...entries]

  const direction = sortDirection === 'asc' ? 1 : -1

  /**
   * ソート方向を掛ける前の比較値を求める。
   * @param left - 左側の結果。
   * @param right - 右側の結果。
   * @returns 昇順で left が先なら負の値。
   */
  const compare = (left: UnifiedWeakChartEntry, right: UnifiedWeakChartEntry): number => {
    switch (sortKey) {
      case 'title':
        return compareSongsByReading(left.record, right.record)
      case 'difficulty':
        return (
          PLAYER_DATA_DIFFICULTIES.indexOf(left.record.difficulty) -
          PLAYER_DATA_DIFFICULTIES.indexOf(right.record.difficulty)
        )
      case 'const':
        return left.record.const - right.record.const
      case 'score':
        return left.record.score - right.record.score
      case 'category':
        return (
          UNIFIED_WEAK_CHART_CATEGORIES.indexOf(left.category) -
          UNIFIED_WEAK_CHART_CATEGORIES.indexOf(right.category)
        )
      case 'aptitude':
        return (left.aptitude ?? 0) - (right.aptitude ?? 0)
    }
  }

  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      if (sortKey === 'aptitude') {
        const leftMissing = left.entry.aptitude === null
        const rightMissing = right.entry.aptitude === null
        if (leftMissing !== rightMissing) return leftMissing ? 1 : -1
      }
      return compare(left.entry, right.entry) * direction || left.index - right.index
    })
    .map(({ entry }) => entry)
}

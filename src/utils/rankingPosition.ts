/** 上位順位に共通で適用するメダル色クラス。 */
const RANKING_MEDAL_CLASS: Readonly<Record<number, string>> = {
  1: 'bg-ranking-gold-bg text-ranking-medal-text',
  2: 'bg-ranking-silver-bg text-ranking-medal-text',
  3: 'bg-ranking-bronze-bg text-ranking-medal-text',
}

/**
 * 順位に対応するメダル色クラスを取得する。
 *
 * @param rank - 1始まりの順位。
 * @param defaultClass - 4位以下へ適用するクラス。
 * @returns 上位3位は共通メダル色、それ以外は指定された既定クラス。
 */
export const getRankingPositionClass = (rank: number, defaultClass: string): string =>
  RANKING_MEDAL_CLASS[rank] ?? defaultClass

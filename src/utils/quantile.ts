/**
 * ソート済み数列の分位点を線形補間で算出する。
 *
 * @param sortedValues - 昇順に並んだ数列。
 * @param percentile - 0から1までの分位。
 * @returns 指定した分位点。
 */
export const quantile = (sortedValues: readonly number[], percentile: number): number => {
  const position = (sortedValues.length - 1) * percentile
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)
  const ratio = position - lowerIndex

  return sortedValues[lowerIndex] + (sortedValues[upperIndex] - sortedValues[lowerIndex]) * ratio
}

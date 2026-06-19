type ComboLamp = 'FULL COMBO' | 'ALL JUSTICE' | null

/**
 * APIから返されたAJ時のJUSTICE数を表示・ソート用の値に整形する。
 *
 * @param params 整形対象のコンボランプとJUSTICE数。
 * @param params.comboLamp コンボランプ。
 * @param params.justiceCount APIが算出したJUSTICE数。
 * @returns AJ以外は空文字、AJでJUSTICE数がない場合はハイフン、AJでJUSTICE数がある場合は数値。
 */
export const formatJusticeCountForAj = (params: {
  comboLamp: ComboLamp
  justiceCount: number | null
}): number | '-' | '' => {
  if (params.comboLamp !== 'ALL JUSTICE') return ''
  return params.justiceCount ?? '-'
}

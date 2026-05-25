import type { HonorDTO } from '../types/api'

export type HonorTypeName = HonorDTO['type_name']

/**
 * APIの称号種別を称号背景のCSSクラス名へ変換する。
 */
export const HONOR_TYPE_CLASS_NAMES: Record<HonorTypeName, string> = {
  normal: 'user-honor-title--normal',
  copper: 'user-honor-title--copper',
  silver: 'user-honor-title--silver',
  gold: 'user-honor-title--gold',
  platina: 'user-honor-title--platina',
  rainbow: 'user-honor-title--rainbow',
  staff: 'user-honor-title--staff',
  ongeki: 'user-honor-title--ongeki',
  maimai: 'user-honor-title--maimai',
  sp: 'user-honor-title--sp',
  phoenix_g: 'user-honor-title--phoenix-g',
  phoenix_p: 'user-honor-title--phoenix-p',
  phoenix_r: 'user-honor-title--phoenix-r',
  expert: 'user-honor-title--expert',
  master: 'user-honor-title--master',
  ultima: 'user-honor-title--ultima',
}

/**
 * 称号種別に対応するCSSクラス名を返す。
 *
 * @param typeName - APIから取得した称号種別名。
 * @returns 称号表示用のCSSクラス名。未定義の種別は通常称号のクラス名。
 */
export const getHonorTypeClassName = (typeName: string): string => {
  if (typeName in HONOR_TYPE_CLASS_NAMES) {
    return HONOR_TYPE_CLASS_NAMES[typeName as HonorTypeName]
  }

  return HONOR_TYPE_CLASS_NAMES.normal
}

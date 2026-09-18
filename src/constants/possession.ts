import type { PossessionName } from '../types/api'

/** ポゼッションの正規名称。IDはマスタから解決する */
export const POSSESSION_NAMES = [
  'normal',
  'silver',
  'gold',
  'platina',
  'rainbow',
] as const satisfies readonly PossessionName[]

/** 未指定時に使うポゼッション名。APIの省略時既定値と一致する */
export const DEFAULT_POSSESSION_NAME: PossessionName = 'normal'

/**
 * ポゼッション名を背景のCSSクラス名へ変換する。
 * プロフィールカードとレーティング枠画像 Ver. 2 のヘッダーで使う。
 * normal はテーマのサーフェス色のままにする。
 */
export const POSSESSION_CLASS_NAMES: Record<PossessionName, string> = {
  normal: '',
  silver: 'user-nameplate--silver',
  gold: 'user-nameplate--gold',
  platina: 'user-nameplate--platina',
  rainbow: 'user-nameplate--rainbow',
}

const POSSESSION_NAME_SET: ReadonlySet<string> = new Set(POSSESSION_NAMES)

/**
 * 外部入力のポゼッション名がマスタの正規値かを判定する。
 *
 * @param value - APIやマスタから受け取ったポゼッション名。
 * @returns 正規のポゼッション名なら true。
 */
export const isPossessionName = (value: string): value is PossessionName =>
  POSSESSION_NAME_SET.has(value)

/**
 * ポゼッション名に対応する背景のCSSクラス名を返す。
 *
 * @param name - マスタから解決したポゼッション名。
 * @returns 着色用のCSSクラス名。normal と未定義の名称は空文字。
 */
export const getPossessionClassName = (name: string): string => {
  if (!isPossessionName(name) || name === DEFAULT_POSSESSION_NAME) {
    return ''
  }

  return `user-nameplate--colored ${POSSESSION_CLASS_NAMES[name]}`
}

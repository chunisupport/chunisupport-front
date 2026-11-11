/** 幅の広い画面で縦レールとして表示するナビゲーションの配置側 */
export type NavRailSide = 'left' | 'right'

/** 幅の狭い画面で横バーとして表示するナビゲーションの配置側 */
export type NavBarSide = 'bottom' | 'top'

/** 縦レールの配置側を保存する localStorage のキー */
export const NAV_RAIL_SIDE_STORAGE_KEY = 'chunisupport-nav-rail-side'
/** 横バーの配置側を保存する localStorage のキー */
export const NAV_BAR_SIDE_STORAGE_KEY = 'chunisupport-nav-bar-side'

/** 縦レールの選択肢。先頭が既定値 */
export const NAV_RAIL_SIDES = ['left', 'right'] as const satisfies readonly NavRailSide[]
/** 横バーの選択肢。先頭が既定値 */
export const NAV_BAR_SIDES = ['bottom', 'top'] as const satisfies readonly NavBarSide[]

/**
 * localStorageから配置側を読み取る。
 * @param storageKey 読み取り対象のストレージキー
 * @param sides 有効な配置側の一覧。先頭を既定値として扱う
 * @returns 保存済みの有効な配置側。未設定、不正値、読み取り不能の場合は既定値
 */
const readSide = <TSide extends string>(
  storageKey: string,
  sides: readonly [TSide, ...TSide[]]
): TSide => {
  try {
    const value = window.localStorage.getItem(storageKey)
    return sides.find((side) => side === value) ?? sides[0]
  } catch {
    return sides[0]
  }
}

/**
 * 配置側をlocalStorageへ保存する。
 * @param storageKey 保存先のストレージキー
 * @param side 保存する配置側
 * @returns なし
 */
const saveSide = (storageKey: string, side: string): void => {
  try {
    window.localStorage.setItem(storageKey, side)
  } catch {
    // 保存できない環境でも、現在の表示だけは切り替えられるようにする。
  }
}

/**
 * 縦レールの配置側を読み取る。
 * @returns 保存済みの配置側。未設定または不正値の場合は左
 */
export const readNavRailSide = (): NavRailSide =>
  readSide(NAV_RAIL_SIDE_STORAGE_KEY, NAV_RAIL_SIDES)

/**
 * 縦レールの配置側を保存する。
 * @param side 保存する配置側
 * @returns なし
 */
export const saveNavRailSide = (side: NavRailSide): void =>
  saveSide(NAV_RAIL_SIDE_STORAGE_KEY, side)

/**
 * 横バーの配置側を読み取る。
 * @returns 保存済みの配置側。未設定または不正値の場合は下
 */
export const readNavBarSide = (): NavBarSide => readSide(NAV_BAR_SIDE_STORAGE_KEY, NAV_BAR_SIDES)

/**
 * 横バーの配置側を保存する。
 * @param side 保存する配置側
 * @returns なし
 */
export const saveNavBarSide = (side: NavBarSide): void => saveSide(NAV_BAR_SIDE_STORAGE_KEY, side)

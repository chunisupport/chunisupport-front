import { createSignal } from 'solid-js'
import { readNavBarCompactMode, saveNavBarCompactMode } from '../utils/navBarCompactMode'
import {
  type NavBarSide,
  type NavRailSide,
  type NavRailVerticalAlign,
  readNavBarSide,
  readNavRailSide,
  readNavRailVerticalAlign,
  saveNavBarSide,
  saveNavRailSide,
  saveNavRailVerticalAlign,
} from '../utils/navPlacementPreference'

/** 縦レールと横バーそれぞれの、現在の配置側を表す共有状態 */
const [navRailSide, setNavRailSideSignal] = createSignal<NavRailSide>(readNavRailSide())
const [navBarSide, setNavBarSideSignal] = createSignal<NavBarSide>(readNavBarSide())

/** 縦レールの項目の縦位置を表す共有状態 */
const [navRailVerticalAlign, setNavRailVerticalAlignSignal] = createSignal<NavRailVerticalAlign>(
  readNavRailVerticalAlign()
)

/** 横バーのコンパクトモードが有効かを表す共有状態 */
const [navBarCompactMode, setNavBarCompactModeSignal] = createSignal(readNavBarCompactMode())

export { navBarCompactMode, navBarSide, navRailSide, navRailVerticalAlign }

/**
 * 縦レールの配置側を共有状態と永続ストレージへ反映する。
 * @param side 適用する配置側
 * @returns なし
 */
export const updateNavRailSide = (side: NavRailSide): void => {
  saveNavRailSide(side)
  setNavRailSideSignal(side)
}

/**
 * 横バーの配置側を共有状態と永続ストレージへ反映する。
 * @param side 適用する配置側
 * @returns なし
 */
export const updateNavBarSide = (side: NavBarSide): void => {
  saveNavBarSide(side)
  setNavBarSideSignal(side)
}

/**
 * 縦レールの項目の縦位置を共有状態と永続ストレージへ反映する。
 * @param align 適用する縦位置
 * @returns なし
 */
export const updateNavRailVerticalAlign = (align: NavRailVerticalAlign): void => {
  saveNavRailVerticalAlign(align)
  setNavRailVerticalAlignSignal(align)
}

/**
 * 横バーのコンパクトモードを共有状態と永続ストレージへ反映する。
 * @param enabled コンパクトモードを有効にするか
 * @returns なし
 */
export const updateNavBarCompactMode = (enabled: boolean): void => {
  saveNavBarCompactMode(enabled)
  setNavBarCompactModeSignal(enabled)
}

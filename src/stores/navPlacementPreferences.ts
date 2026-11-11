import { createSignal } from 'solid-js'
import {
  type NavBarSide,
  type NavRailSide,
  readNavBarSide,
  readNavRailSide,
  saveNavBarSide,
  saveNavRailSide,
} from '../utils/navPlacementPreference'

/** 縦レールと横バーそれぞれの、現在の配置側を表す共有状態 */
const [navRailSide, setNavRailSideSignal] = createSignal<NavRailSide>(readNavRailSide())
const [navBarSide, setNavBarSideSignal] = createSignal<NavBarSide>(readNavBarSide())

export { navBarSide, navRailSide }

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

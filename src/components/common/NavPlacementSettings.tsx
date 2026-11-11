import type { LucideIcon } from 'lucide-solid'
import Monitor from 'lucide-solid/icons/monitor'
import PanelBottom from 'lucide-solid/icons/panel-bottom'
import PanelLeft from 'lucide-solid/icons/panel-left'
import PanelRight from 'lucide-solid/icons/panel-right'
import PanelTop from 'lucide-solid/icons/panel-top'
import Smartphone from 'lucide-solid/icons/smartphone'
import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import {
  navBarSide,
  navRailSide,
  updateNavBarSide,
  updateNavRailSide,
} from '../../stores/navPlacementPreferences'
import {
  NAV_BAR_SIDES,
  NAV_RAIL_SIDES,
  type NavBarSide,
  type NavRailSide,
} from '../../utils/navPlacementPreference'
import { NAV_PLACEMENT_SETTINGS_COPY } from './AppearanceSettings.constants'
import { type AppTabOption, SegmentedToggleGroup } from './AppTabs'

/** 配置側ごとに、その配置を図示するアイコン */
const NAV_SIDE_ICONS: Record<NavRailSide | NavBarSide, LucideIcon> = {
  left: PanelLeft,
  right: PanelRight,
  bottom: PanelBottom,
  top: PanelTop,
}

/** 配置側の選択肢をタッチ操作しやすい大きさにするクラス */
const NAV_SIDE_TOGGLE_ITEM_CLASS = 'min-h-11 min-w-20'

/**
 * 配置側の一覧を、配置を示すアイコン付きの選択肢へ変換する。
 *
 * @param sides - 選択肢にする配置側の一覧。
 * @returns SegmentedToggleGroup に渡す選択肢。
 */
const toSideOptions = <TSide extends NavRailSide | NavBarSide>(
  sides: readonly TSide[]
): AppTabOption<TSide>[] =>
  sides.map((side) => {
    const Icon = NAV_SIDE_ICONS[side]
    return {
      value: side,
      label: (
        <>
          <Icon class="h-4 w-4" aria-hidden="true" />
          {NAV_PLACEMENT_SETTINGS_COPY.sideLabels[side]}
        </>
      ),
    }
  })

/**
 * 配置設定に表示する行の範囲。
 * `all` は縦レールと横バーの両方、`current` は現在の画面幅で表示中のナビゲーションに対応する行だけを表示する。
 */
type NavPlacementSettingsScope = 'all' | 'current'

type NavPlacementSettingsProps = {
  /** 表示する行の範囲。既定は `all` */
  scope?: NavPlacementSettingsScope
}

/** 縦レール用の行を、表示範囲に応じて出し分けるクラス */
const NAV_RAIL_ROW_CLASS: Record<NavPlacementSettingsScope, string> = {
  all: 'flex',
  current: 'hidden md:flex',
}

/** 横バー用の行を、表示範囲に応じて出し分けるクラス */
const NAV_BAR_ROW_CLASS: Record<NavPlacementSettingsScope, string> = {
  all: 'flex',
  current: 'flex md:hidden',
}

/**
 * ナビゲーションの配置側を、幅の広い画面（縦レール）と狭い画面（横バー）で別々に選択するUIを表示する。
 * 縦レールか横バーかは画面幅で決まるため、ここでは寄せる側だけを選ぶ。
 * 両方の行を並べる場合のみ、どちらの画面幅向けかを示す端末アイコンを添える。
 *
 * @param props - 表示する行の範囲。
 * @returns ナビゲーション配置設定のJSX要素
 */
const NavPlacementSettings = (props: NavPlacementSettingsProps): JSX.Element => {
  const scope = (): NavPlacementSettingsScope => props.scope ?? 'all'

  return (
    <div>
      <p class="mb-1 block text-sm text-text-muted">{NAV_PLACEMENT_SETTINGS_COPY.label}</p>
      <div class="grid gap-3">
        <div class={`items-center gap-3 ${NAV_RAIL_ROW_CLASS[scope()]}`}>
          <Show when={scope() === 'all'}>
            <Monitor class="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
          </Show>
          <SegmentedToggleGroup<NavRailSide>
            options={toSideOptions(NAV_RAIL_SIDES)}
            value={navRailSide()}
            onChange={updateNavRailSide}
            ariaLabel={NAV_PLACEMENT_SETTINGS_COPY.railAriaLabel}
            itemClass={NAV_SIDE_TOGGLE_ITEM_CLASS}
          />
        </div>
        <div class={`items-center gap-3 ${NAV_BAR_ROW_CLASS[scope()]}`}>
          <Show when={scope() === 'all'}>
            <Smartphone class="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
          </Show>
          <SegmentedToggleGroup<NavBarSide>
            options={toSideOptions(NAV_BAR_SIDES)}
            value={navBarSide()}
            onChange={updateNavBarSide}
            ariaLabel={NAV_PLACEMENT_SETTINGS_COPY.barAriaLabel}
            itemClass={NAV_SIDE_TOGGLE_ITEM_CLASS}
          />
        </div>
      </div>
    </div>
  )
}

export default NavPlacementSettings

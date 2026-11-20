import { Tooltip } from '@kobalte/core/tooltip'
import type { LucideIcon } from 'lucide-solid'
import Eye from 'lucide-solid/icons/eye'
import Globe from 'lucide-solid/icons/globe'
import Pencil from 'lucide-solid/icons/pencil'
import Users from 'lucide-solid/icons/users'
import type { Component } from 'solid-js'
import { For } from 'solid-js'
import type { ApiTokenPermission } from '../../types/api'
import { formatApiTokenPermission, formatApiTokenPublicOnly } from './ApiTokenSettings.constants'

/** 権限ごとに並べるアイコン。書き込みは読み取りに加わる権限なので両方を並べる。 */
const API_TOKEN_PERMISSION_ICONS: Record<ApiTokenPermission, readonly LucideIcon[]> = {
  read: [Eye],
  read_write: [Eye, Pencil],
}

/**
 * 参照範囲ごとに並べるアイコンを返す。フレンドを含む範囲は公開範囲に加わるので両方を並べる。
 *
 * @param publicOnly - 公開ユーザーのみ参照するか。
 * @returns 並べるアイコン。
 */
const getApiTokenPublicOnlyIcons = (publicOnly: boolean): readonly LucideIcon[] =>
  publicOnly ? [Globe] : [Globe, Users]

type ApiTokenIconRowProps = {
  /** 丸バッジにして並べるアイコン */
  icons: readonly LucideIcon[]
}

/**
 * アイコンを丸バッジにして横に並べる。読み上げは呼び出し側のラベルに任せる。
 *
 * @param props - 並べるアイコン。
 * @returns 装飾扱いの丸バッジ列。
 */
const ApiTokenIconRow: Component<ApiTokenIconRowProps> = (props) => (
  <span class="inline-flex items-center gap-1" aria-hidden="true">
    <For each={props.icons}>
      {(Icon) => (
        <span class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-action-primary bg-surface text-action-primary">
          <Icon class="h-3.5 w-3.5" />
        </span>
      )}
    </For>
  </span>
)

type ApiTokenPermissionProps = {
  /** 表示するAPIトークン権限 */
  permission: ApiTokenPermission
}

type ApiTokenPublicOnlyProps = {
  /** 公開ユーザーのみ参照するか */
  publicOnly: boolean
}

/**
 * APIトークン権限の丸バッジ列だけを表示する。
 *
 * @param props - 表示する権限。
 * @returns 装飾扱いの丸バッジ列。
 */
export const ApiTokenPermissionIconRow: Component<ApiTokenPermissionProps> = (props) => (
  <ApiTokenIconRow icons={API_TOKEN_PERMISSION_ICONS[props.permission]} />
)

/**
 * 参照範囲の丸バッジ列だけを表示する。
 *
 * @param props - 表示する参照範囲。
 * @returns 装飾扱いの丸バッジ列。
 */
export const ApiTokenPublicOnlyIconRow: Component<ApiTokenPublicOnlyProps> = (props) => (
  <ApiTokenIconRow icons={getApiTokenPublicOnlyIcons(props.publicOnly)} />
)

type ApiTokenTooltipIconsProps = ApiTokenIconRowProps & {
  /** 読み上げラベルとツールチップに使う表示名 */
  label: string
}

/**
 * 丸バッジ列をアイコンのみで表示し、表示名を読み上げラベルとツールチップで補う。
 *
 * @param props - 並べるアイコンと表示名。
 * @returns ツールチップ付きの丸バッジ列。
 */
const ApiTokenTooltipIcons: Component<ApiTokenTooltipIconsProps> = (props) => (
  <Tooltip placement="top" gutter={4} openDelay={400}>
    <Tooltip.Trigger as="span" class="inline-flex align-middle" role="img" aria-label={props.label}>
      <ApiTokenIconRow icons={props.icons} />
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content class="z-50 rounded-md border border-border-strong bg-surface-raised px-2 py-1 text-xs text-text shadow-lg">
        {props.label}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip>
)

/**
 * APIトークン権限をアイコンのみで表示する。
 *
 * @param props - 表示する権限。
 * @returns ツールチップ付きの権限アイコン。
 */
export const ApiTokenPermissionIcons: Component<ApiTokenPermissionProps> = (props) => (
  <ApiTokenTooltipIcons
    icons={API_TOKEN_PERMISSION_ICONS[props.permission]}
    label={formatApiTokenPermission(props.permission)}
  />
)

/**
 * 参照範囲をアイコンのみで表示する。
 *
 * @param props - 表示する参照範囲。
 * @returns ツールチップ付きの参照範囲アイコン。
 */
export const ApiTokenPublicOnlyIcons: Component<ApiTokenPublicOnlyProps> = (props) => (
  <ApiTokenTooltipIcons
    icons={getApiTokenPublicOnlyIcons(props.publicOnly)}
    label={formatApiTokenPublicOnly(props.publicOnly)}
  />
)

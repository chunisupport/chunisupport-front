import { Award, CalendarRange, ChartPie, Music, Route, Users, Wrench } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { SelectableCardLink } from './SelectableCardButton'

/** スタッフ向けメニューカードに表示するアイコン種別 */
export type StaffMenuLinkIcon =
  | 'coverage'
  | 'maintenance'
  | 'users'
  | 'songs'
  | 'courses'
  | 'honors'
  | 'versions'

export type StaffMenuLink = {
  /** 遷移先のアプリ内パス */
  href: string
  /** カードに表示する画面名 */
  title: string
  /** カードに表示する画面の概要 */
  description: string
  /** カードに表示するアイコン種別 */
  icon: StaffMenuLinkIcon
}

type StaffMenuPageProps = {
  /** ドキュメントタイトル */
  pageTitle: string
  /** ページ上部に表示する見出し */
  heading: string
  /** ページ上部に表示するメニューの概要 */
  description: string
  /** メニューに表示する各画面へのリンク */
  links: readonly StaffMenuLink[]
  /** 見出しの下へ追加表示する権限固有の情報 */
  supplementaryContent?: JSX.Element
}

const STAFF_MENU_ICON_CLASS = 'h-5 w-5 text-action-primary'

/**
 * メニューリンクの種類に対応するアイコンを表示する。
 *
 * @param props.icon - 表示するメニューアイコンの種類。
 * @returns スタッフメニューカード用アイコン。
 */
const StaffMenuCardIcon = (props: { icon: StaffMenuLinkIcon }) => {
  switch (props.icon) {
    case 'coverage':
      return <ChartPie class={STAFF_MENU_ICON_CLASS} aria-hidden="true" />
    case 'maintenance':
      return <Wrench class={STAFF_MENU_ICON_CLASS} aria-hidden="true" />
    case 'users':
      return <Users class={STAFF_MENU_ICON_CLASS} aria-hidden="true" />
    case 'songs':
      return <Music class={STAFF_MENU_ICON_CLASS} aria-hidden="true" />
    case 'courses':
      return <Route class={STAFF_MENU_ICON_CLASS} aria-hidden="true" />
    case 'honors':
      return <Award class={STAFF_MENU_ICON_CLASS} aria-hidden="true" />
    case 'versions':
      return <CalendarRange class={STAFF_MENU_ICON_CLASS} aria-hidden="true" />
  }
}

/**
 * スタッフ権限別の管理画面リンクをカード形式で表示する。
 *
 * @param props - ページの表示文言とリンク一覧。
 * @returns 権限別のスタッフ向けメニュー。
 */
export const StaffMenuPage = (props: StaffMenuPageProps) => {
  useDocumentTitle(props.pageTitle)

  return (
    <div class="mx-auto w-full max-w-4xl p-6">
      <h1 class="text-2xl font-semibold">{props.heading}</h1>
      <p class="mt-2 text-sm text-text-muted">{props.description}</p>
      {props.supplementaryContent}

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <For each={props.links}>
          {(link) => (
            <SelectableCardLink
              href={link.href}
              class="min-h-24 items-center"
              icon={
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
                  <StaffMenuCardIcon icon={link.icon} />
                </span>
              }
              title={link.title}
              titleClass="text-base"
              description={link.description}
            />
          )}
        </For>
      </div>
    </div>
  )
}

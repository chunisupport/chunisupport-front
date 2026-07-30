import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

export type StaffMenuLink = {
  /** 遷移先のアプリ内パス。 */
  href: string
  /** カードに表示する画面名。 */
  title: string
  /** カードに表示する画面の概要。 */
  description: string
}

type StaffMenuPageProps = {
  /** ドキュメントタイトル。 */
  pageTitle: string
  /** ページ上部に表示する見出し。 */
  heading: string
  /** ページ上部に表示するメニューの概要。 */
  description: string
  /** メニューに表示する各画面へのリンク。 */
  links: readonly StaffMenuLink[]
  /** 見出しの下へ追加表示する権限固有の情報。 */
  supplementaryContent?: JSX.Element
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
            <A
              href={link.href}
              class="rounded-lg border border-border bg-surface p-4 shadow-sm transition hover:border-action-primary-border hover:bg-action-primary-muted"
            >
              <h2 class="text-lg font-semibold text-text">{link.title}</h2>
              <p class="mt-1 text-sm text-text-muted">{link.description}</p>
            </A>
          )}
        </For>
      </div>
    </div>
  )
}

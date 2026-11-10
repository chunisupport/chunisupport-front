import { ChevronLeft, ChevronRight } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createMemo, For, Show } from 'solid-js'
import { buildPaginationItems } from '../../utils/pagination'
import { AppButton, AppIconButton } from './AppButton'
import { PAGINATION_NAV_COPY } from './PaginationNav.constants'

type PaginationNavProps = {
  /** 現在のページ番号（1始まり） */
  currentPage: number
  /** 総ページ数 */
  totalPages: number
  /** ページ変更を無効にするか */
  disabled?: boolean
  /** 選択したページ番号の通知先 */
  onPageChange: (page: number) => void
  /** スクリーンリーダー向けラベル。省略時は共通文言を使う */
  labels?: {
    nav: string
    previous: string
    next: string
  }
}

const PAGE_NUMBER_BUTTON_CLASS = 'min-h-10 min-w-10 px-2 font-jost tabular-nums'

/**
 * 先頭・末尾・現在ページ付近の番号が並ぶページネーションを表示する。
 *
 * @param props - 現在ページ、総ページ数、無効状態、ページ変更ハンドラー。
 * @returns 総ページ数が2以上のときだけ表示するページ番号ナビゲーション。
 */
export const PaginationNav = (props: PaginationNavProps): JSX.Element => {
  const labels = () => props.labels ?? PAGINATION_NAV_COPY
  const items = createMemo(() => buildPaginationItems(props.currentPage, props.totalPages))

  /**
   * 指定ページへ移動する。範囲外・同一ページ・無効時は何もしない。
   *
   * @param nextPage - 移動先のページ番号。
   */
  const goToPage = (nextPage: number): void => {
    if (props.disabled) return
    if (nextPage < 1 || nextPage > props.totalPages) return
    if (nextPage === props.currentPage) return
    props.onPageChange(nextPage)
  }

  return (
    <Show when={props.totalPages > 1}>
      <nav aria-label={labels().nav}>
        <div class="flex flex-wrap items-center justify-center gap-1 sm:justify-end">
          <AppIconButton
            size="md"
            aria-label={labels().previous}
            disabled={props.disabled || props.currentPage <= 1}
            onClick={() => goToPage(props.currentPage - 1)}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </AppIconButton>
          <ol class="flex flex-wrap items-center gap-1">
            <For each={items()}>
              {(item) => (
                <li>
                  <Show
                    when={item.type === 'page' ? item.page : false}
                    fallback={
                      <span class="px-1 text-text-muted" aria-hidden="true">
                        …
                      </span>
                    }
                  >
                    {(pageNumber) => (
                      <AppButton
                        variant={pageNumber() === props.currentPage ? 'primary' : 'surface'}
                        size="sm"
                        class={PAGE_NUMBER_BUTTON_CLASS}
                        aria-current={pageNumber() === props.currentPage ? 'page' : undefined}
                        disabled={props.disabled}
                        onClick={() => goToPage(pageNumber())}
                      >
                        {pageNumber()}
                      </AppButton>
                    )}
                  </Show>
                </li>
              )}
            </For>
          </ol>
          <AppIconButton
            size="md"
            aria-label={labels().next}
            disabled={props.disabled || props.currentPage >= props.totalPages}
            onClick={() => goToPage(props.currentPage + 1)}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </AppIconButton>
        </div>
      </nav>
    </Show>
  )
}

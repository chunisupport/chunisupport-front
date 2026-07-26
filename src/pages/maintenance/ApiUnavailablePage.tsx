import { WifiOff } from 'lucide-solid'
import { onMount } from 'solid-js'
import { AppButton } from '../../components/common/AppButton'
import {
  API_UNAVAILABLE_MESSAGE,
  API_UNAVAILABLE_PAGE_COPY,
  API_UNAVAILABLE_RETRY_BUTTON_LABEL,
} from '../../constants/maintenance'
import { API_UNAVAILABLE_PAGE_TITLE } from '../../constants/pageTitles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

type ApiUnavailablePageProps = {
  isRefreshing: boolean
  announcement: string
  onRetry: () => void
}

/**
 * APIへ接続できない場合にメンテナンスとは区別した再試行画面を表示する。
 *
 * @param props - 再試行の状態、読み上げ文言、再試行処理。
 * @returns API接続不能専用画面。
 */
const ApiUnavailablePage = (props: ApiUnavailablePageProps) => {
  let mainElement: HTMLElement | undefined
  useDocumentTitle(API_UNAVAILABLE_PAGE_TITLE)

  onMount(() => {
    mainElement?.focus()
  })

  return (
    <main
      ref={mainElement}
      tabIndex={-1}
      class="flex min-h-dvh w-full items-center justify-center bg-bg px-4 py-10 text-text focus:outline-none"
    >
      <section class="w-full max-w-lg rounded-xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger">
          <WifiOff class="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 class="mt-4 text-2xl font-semibold">{API_UNAVAILABLE_PAGE_COPY.heading}</h1>
        <p class="mt-3 text-sm leading-relaxed text-text-muted">{API_UNAVAILABLE_MESSAGE}</p>

        <AppButton
          variant="primary"
          class="mt-6"
          disabled={props.isRefreshing}
          onClick={props.onRetry}
        >
          {props.isRefreshing
            ? API_UNAVAILABLE_PAGE_COPY.retrying
            : API_UNAVAILABLE_RETRY_BUTTON_LABEL}
        </AppButton>

        <p class="sr-only" aria-live="polite" aria-atomic="true">
          {props.announcement}
        </p>
      </section>
    </main>
  )
}

export default ApiUnavailablePage

import type { Component } from 'solid-js'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage.ts'

type Props = {
  error: unknown
}

const LOAD_ERROR_FALLBACK_MESSAGE = 'データの取得に失敗しました。時間をおいて再度お試しください。'

/**
 * 画面初期表示に必要なデータ取得エラーを表示する。
 *
 * @param props - 表示対象のエラー。
 * @returns データ取得エラーの表示。
 */
const LoadError: Component<Props> = (props) => {
  const message = () => toUserFriendlyErrorMessage(props.error, LOAD_ERROR_FALLBACK_MESSAGE)

  return (
    <p
      class="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger"
      aria-live="polite"
    >
      {message()}
    </p>
  )
}

export default LoadError

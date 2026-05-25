import type { Component } from 'solid-js'

type Props = {
  error: unknown
}

/**
 * 画面初期表示に必要なデータ取得エラーを表示する。
 *
 * @param props - 表示対象のエラー。
 * @returns データ取得エラーの表示。
 */
const LoadError: Component<Props> = (props) => {
  const message = () =>
    props.error instanceof Error ? props.error.message : '取得に失敗しました。'

  return (
    <p class="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger">
      ERROR: {message()}
    </p>
  )
}

export default LoadError

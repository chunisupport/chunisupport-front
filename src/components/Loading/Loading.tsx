import type { JSX } from 'solid-js'

export type LoadingSize = 'default' | 'inline'

type LoadingProps = {
  /** ローディング表示の大きさ。 */
  size?: LoadingSize
  /** スクリーンリーダーへ通知する処理内容。 */
  ariaLabel?: string
  /** 親要素が処理中状態を通知する場合に装飾表示として扱うか。 */
  ariaHidden?: boolean
}

const LOADING_SPINNER_SIZE_CLASS: Record<LoadingSize, string> = {
  default: 'h-16 w-16 border-4',
  inline: 'h-4 w-4 border-2',
}

/**
 * 共通の回転インジケーターで処理中状態を表示する。
 *
 * @param props - 表示サイズとスクリーンリーダー向けラベル。
 * @returns 指定サイズのローディング表示。
 */
const Loading = (props: LoadingProps): JSX.Element => {
  const size = () => props.size ?? 'default'

  return (
    <div
      class="flex h-full items-center justify-center overflow-hidden"
      role="status"
      aria-label={props.ariaLabel ?? '読み込み中'}
      aria-hidden={props.ariaHidden}
    >
      <div
        class={`animate-spin rounded-full border-border-strong border-t-transparent ${LOADING_SPINNER_SIZE_CLASS[size()]}`}
      ></div>
    </div>
  )
}

export default Loading

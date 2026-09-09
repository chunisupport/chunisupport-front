import { Image } from '@kobalte/core/image'
import { type Component, createEffect, createSignal, type JSX, on } from 'solid-js'
import { buildChunithmJacketRetryUrl } from '../../utils/jacket'

type JacketLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'

type Props = {
  /** 取得対象のジャケット画像URL */
  source?: string
  /** 画像の代替テキスト */
  alt: string
  /** Kobalte Imageルートへ適用するクラス */
  class?: string
  /** 画像要素へ適用するクラス */
  imageClass?: string
  /** フォールバック領域へ適用するクラス */
  fallbackClass?: string
  /** 読み込み中または失敗時に表示する内容 */
  fallback?: JSX.Element
  /** 装飾画像として支援技術から隠すかどうか */
  ariaHidden?: boolean
  /** CORS画像の取得モード */
  crossOrigin?: 'anonymous' | 'use-credentials'
  /** DOM画像の読み込み完了時に呼び出す処理 */
  onLoad?: JSX.EventHandlerUnion<HTMLImageElement, Event>
  /** キャッシュ回避後の最終的な読み込み状態を通知する処理 */
  onLoadingStatusChange?: (status: JacketLoadingStatus) => void
}

let retrySequence = 0

/**
 * 訪問ごとに異なるジャケット画像の再取得キーを生成する。
 *
 * @returns 現在時刻とページ内連番を組み合わせたキー。
 */
const createRetryKey = (): string => `${Date.now()}-${retrySequence++}`

/**
 * ジャケット画像を表示し、失敗キャッシュを一度だけ回避して再取得する。
 *
 * @param props - 画像URL、表示属性、フォールバック、状態通知処理。
 * @returns キャッシュ回避処理を備えたKobalte Image。
 */
export const JacketImage: Component<Props> = (props) => {
  const [resolvedSource, setResolvedSource] = createSignal(props.source)
  let retried = false

  createEffect(
    on(
      () => props.source,
      (source) => {
        retried = false
        setResolvedSource(source)
      },
      { defer: true }
    )
  )

  /**
   * 失敗時は古いHTTPキャッシュを使わないURLへ切り替え、再試行後の状態だけを通知する。
   *
   * @param status - Kobalte Imageが通知した読み込み状態。
   * @returns なし。
   */
  const handleLoadingStatusChange = (status: JacketLoadingStatus): void => {
    if (status === 'error' && props.source && !retried) {
      retried = true
      setResolvedSource(buildChunithmJacketRetryUrl(props.source, createRetryKey()))
      return
    }

    props.onLoadingStatusChange?.(status)
  }

  return (
    <Image
      class={props.class}
      aria-hidden={props.ariaHidden}
      onLoadingStatusChange={handleLoadingStatusChange}
    >
      <Image.Img
        src={resolvedSource()}
        alt={props.alt}
        class={props.imageClass}
        crossOrigin={props.crossOrigin}
        onLoad={props.onLoad}
      />
      {props.fallback !== undefined && (
        <Image.Fallback class={props.fallbackClass}>{props.fallback}</Image.Fallback>
      )}
    </Image>
  )
}

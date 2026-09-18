import type { Component, JSX } from 'solid-js'
import { createEffect, createSignal, on } from 'solid-js'
import placeholderImageUrl from '../../../../assets/placeholder.png'
import { JacketImage } from '../../../../components/common/JacketImage'

type JacketLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'

type RatingImageJacketMediaProps = {
  /** 取得対象のジャケット画像URL */
  source: string
  /** 画像化対象内でジャケット画像を識別するキー */
  jacketKey: string
  /** ジャケット画像の準備状態を通知するコールバック */
  onJacketReadyChange: (key: string, ready: boolean) => void
  /** Kobalte Imageルートへ適用するクラス */
  class?: string
  /** 元画像とプレースホルダー画像へ適用するクラス */
  imageClass: string
  /** フォールバック領域へ適用するクラス */
  fallbackClass?: string
}

/**
 * レーティング枠画像用のジャケットを読み込み、デコード完了を通知する。
 *
 * @param props - 画像URL、識別キー、準備完了通知、表示クラス。
 * @returns 元画像またはプレースホルダーを表示するジャケット。
 */
export const RatingImageJacketMedia: Component<RatingImageJacketMediaProps> = (props) => {
  const [jacketLoadingStatus, setJacketLoadingStatus] = createSignal<JacketLoadingStatus>('idle')
  let fallbackLoaded = false

  createEffect(
    on(
      () => props.source,
      () => {
        fallbackLoaded = false
      }
    )
  )

  /**
   * 元ジャケットの読み込み状態を反映し、表示可能になったカードを通知する。
   *
   * @param status - Kobalte Imageが通知した読み込み状態。
   * @returns なし。
   */
  const handleJacketLoadingStatusChange = (status: JacketLoadingStatus): void => {
    setJacketLoadingStatus(status)

    if (status === 'error' && fallbackLoaded) {
      props.onJacketReadyChange(props.jacketKey, true)
      return
    }

    props.onJacketReadyChange(props.jacketKey, false)
  }

  /**
   * DOMへ追加された元ジャケットのデコード完了後に準備完了を通知する。
   *
   * @param event - 読み込みを完了したジャケット画像のイベント。
   * @returns なし。
   */
  const handleJacketLoad: JSX.EventHandlerUnion<HTMLImageElement, Event> = (event): void => {
    void event.currentTarget
      .decode()
      .catch(() => undefined)
      .then(() => props.onJacketReadyChange(props.jacketKey, true))
  }

  /**
   * プレースホルダーの読み込み完了を記録し、元画像が失敗済みなら準備完了を通知する。
   *
   * @param event - 読み込みを完了したプレースホルダー画像のイベント。
   * @returns なし。
   */
  const handleFallbackLoad: JSX.EventHandlerUnion<HTMLImageElement, Event> = (event): void => {
    void event.currentTarget
      .decode()
      .catch(() => undefined)
      .then(() => {
        fallbackLoaded = true
        if (jacketLoadingStatus() === 'error') {
          props.onJacketReadyChange(props.jacketKey, true)
        }
      })
  }

  return (
    <JacketImage
      source={props.source}
      alt=""
      class={props.class}
      ariaHidden={true}
      crossOrigin="anonymous"
      imageClass={props.imageClass}
      onLoad={handleJacketLoad}
      onLoadingStatusChange={handleJacketLoadingStatusChange}
      fallbackClass={props.fallbackClass}
      fallback={
        <img
          src={placeholderImageUrl}
          alt=""
          class={props.imageClass}
          onLoad={handleFallbackLoad}
        />
      }
    />
  )
}

/**
 * 汎用ダイアログの枠クラスと、送信中に閉じる要求を捨てる判定。
 * フォーカストラップ、初期フォーカス、トリガーへの復帰、スクロールロックは Kobalte Dialog に任せる。
 */

/** 画面上の置き方 */
export type AppDialogPlacement = 'center' | 'viewport' | 'sheet'

/** ダイアログの幅 */
export type AppDialogSize = 'sm' | 'md' | 'lg' | '2xl' | '3xl'

/**
 * 高さの取り方。
 * `viewport*` は placement `viewport`、`manage` は placement `sheet` と組み合わせる。
 */
export type AppDialogHeight =
  | 'auto'
  | 'max80'
  | 'max90'
  | 'maxScreen'
  | 'cap'
  | 'tall'
  | 'fill90'
  | 'fixed160'
  | 'viewportCap'
  | 'viewportFill'
  | 'viewport80'
  | 'manage'

/**
 * 重なり順。
 * 入れ子は1段ずつ上げる。`nav` はオーバーレイと本体を同じ階層に置く。
 */
export type AppDialogLayer = 'base' | 'raised' | 'stacked' | 'modal' | 'top' | 'nav'

/**
 * 本文のスクロール。
 * `none` は呼び出し側がスクロール領域を持つ。
 */
export type AppDialogScroll = 'none' | 'fill' | 'grow' | 'cap'

/** 枠クラスの入力 */
export type AppDialogFrameOptions = {
  /** 画面上の置き方 */
  placement: AppDialogPlacement
  /** 幅 */
  size: AppDialogSize
  /** 高さ */
  height: AppDialogHeight
  /** 重なり順 */
  layer: AppDialogLayer
  /** 本文の選択を抑止する場合は true */
  selectNone?: boolean
  /** 枠自体の溢れを隠す場合は true。スクロールは本文側に置く */
  overflowHidden?: boolean
  /** 枠線を付ける場合は true */
  bordered?: boolean
}

const LAYER_CLASS: Record<AppDialogLayer, { overlay: string; content: string }> = {
  base: { overlay: 'z-40', content: 'z-50' },
  raised: { overlay: 'z-50', content: 'z-60' },
  stacked: { overlay: 'z-60', content: 'z-70' },
  modal: { overlay: 'z-70', content: 'z-80' },
  top: { overlay: 'z-80', content: 'z-90' },
  nav: { overlay: 'z-50', content: 'z-50' },
}

const CENTER_SIZE_CLASS: Record<AppDialogSize, string> = {
  sm: 'w-[90vw] max-w-sm',
  md: 'w-[90vw] max-w-md',
  lg: 'w-[90vw] max-w-lg',
  '2xl': 'w-[90vw] max-w-2xl',
  '3xl': 'w-[90vw] max-w-3xl',
}

const VIEWPORT_SIZE_CLASS: Record<AppDialogSize, string> = {
  sm: 'sm:w-[90vw] sm:max-w-sm',
  md: 'sm:w-[90vw] sm:max-w-md',
  lg: 'sm:w-[92vw] sm:max-w-lg',
  '2xl': 'sm:w-[92vw] sm:max-w-2xl',
  '3xl': 'sm:w-[92vw] sm:max-w-3xl',
}

const SHEET_SIZE_CLASS: Record<AppDialogSize, string> = {
  sm: 'sm:w-[90vw] sm:max-w-sm',
  md: 'sm:w-[90vw] sm:max-w-md',
  lg: 'sm:w-[90vw] sm:max-w-lg',
  '2xl': 'sm:w-[92vw] sm:max-w-2xl',
  '3xl': 'sm:w-[92vw] sm:max-w-3xl',
}

const HEIGHT_CLASS: Record<AppDialogHeight, string> = {
  auto: '',
  max80: 'max-h-[80dvh]',
  max90: 'max-h-[90dvh]',
  maxScreen: 'max-h-[calc(100dvh-2rem)]',
  cap: 'max-h-11/12',
  tall: 'h-5/6 max-h-11/12',
  fill90: 'h-[90dvh] max-h-[90dvh]',
  fixed160: 'h-160 max-h-[calc(100dvh-2rem)]',
  viewportCap: 'max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh]',
  viewportFill: 'h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] sm:h-[90dvh] sm:max-h-[90dvh]',
  viewport80: 'sm:h-[80dvh]',
  manage: 'h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] sm:h-128',
}

const SCROLL_CLASS: Record<Exclude<AppDialogScroll, 'none'>, string> = {
  fill: 'min-h-0 flex-1 basis-0 overflow-y-auto',
  grow: 'min-h-0 flex-1 overflow-y-auto',
  cap: 'min-h-0 overflow-y-auto',
}

const SURFACE_CLASS = 'rounded-lg bg-surface shadow-lg'

/**
 * 空のクラスを除いて1つの class 文字列にする。
 *
 * @param parts - 結合するクラス。false や空文字は捨てる。
 * @returns 半角空白で結合したクラス。
 */
const joinClass = (...parts: Array<string | false | undefined>): string =>
  parts.filter((part): part is string => Boolean(part)).join(' ')

/**
 * 送信中の閉鎖要求を捨て、それ以外の開閉を呼び出し側へ通知する。
 *
 * @param open - 要求された開閉状態。
 * @param pending - 送信中で閉じさせない場合は true。
 * @param onOpenChange - 通知先。
 * @returns 通知した場合は true。送信中の閉鎖を捨てた場合は false。
 */
export const guardDialogOpenChange = (
  open: boolean,
  pending: boolean,
  onOpenChange: (open: boolean) => void
): boolean => {
  if (!open && pending) return false
  onOpenChange(open)
  return true
}

/**
 * 開いた直後の自動フォーカスをダイアログ本体へ移す。
 * 先頭の入力欄ではなく枠へフォーカスしたい画面で使う。
 *
 * @param event - Kobalte の自動フォーカスイベント。
 * @param content - フォーカスするダイアログ本体。未接続なら何もしない。
 * @returns なし。
 */
export const focusDialogContentOnOpen = (event: Event, content: HTMLElement | undefined): void => {
  event.preventDefault()
  content?.focus()
}

/**
 * オーバーレイのクラスを返す。
 *
 * @param layer - 重なり順。
 * @returns オーバーレイのクラス。
 */
export const appDialogOverlayClass = (layer: AppDialogLayer): string =>
  joinClass('fixed inset-0 bg-overlay', LAYER_CLASS[layer].overlay)

/**
 * ダイアログ枠のクラスを返す。本文のスクロールクラスは含めない。
 *
 * @param options - 置き方、幅、高さ、重なり順と追加の見た目。
 * @returns Dialog.Content に渡すクラス。
 */
export const appDialogContentClass = (options: AppDialogFrameOptions): string => {
  const contentZ = LAYER_CLASS[options.layer].content
  const height = HEIGHT_CLASS[options.height]
  const modifiers = joinClass(
    options.selectNone && 'select-none',
    options.overflowHidden && 'overflow-hidden',
    options.bordered && 'border border-border-strong'
  )

  if (options.placement === 'viewport') {
    return joinClass(
      'fixed inset-x-4 top-4 bottom-4',
      contentZ,
      'flex',
      height,
      'flex-col',
      SURFACE_CLASS,
      'p-4',
      'sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2',
      VIEWPORT_SIZE_CLASS[options.size],
      'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6',
      modifiers
    )
  }

  if (options.placement === 'sheet') {
    return joinClass(
      'fixed inset-x-4 top-1/2',
      contentZ,
      'flex -translate-y-1/2 flex-col',
      height,
      SURFACE_CLASS,
      'p-4',
      'sm:left-1/2 sm:right-auto',
      SHEET_SIZE_CLASS[options.size],
      'sm:-translate-x-1/2 sm:p-6',
      modifiers
    )
  }

  return joinClass(
    'fixed left-1/2 top-1/2',
    contentZ,
    'flex',
    height,
    CENTER_SIZE_CLASS[options.size],
    '-translate-x-1/2 -translate-y-1/2 flex-col',
    SURFACE_CLASS,
    'p-6',
    modifiers
  )
}

/**
 * 本文スクロール領域のクラスを返す。
 * `none` のときはラッパーを作らないため undefined。
 *
 * @param scroll - スクロールの取り方。
 * @param extra - 余白やスクロールバーなど、画面固有の追加クラス。
 * @returns 本文要素のクラス。ラッパーが不要な場合は undefined。
 */
export const appDialogBodyClass = (scroll: AppDialogScroll, extra?: string): string | undefined => {
  if (scroll === 'none') return undefined
  return joinClass(SCROLL_CLASS[scroll], extra)
}

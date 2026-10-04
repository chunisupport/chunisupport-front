import { type Accessor, batch, createEffect, createSignal, onCleanup, untrack } from 'solid-js'
import { SOCIAL_SHARE_TEXT } from '../constants/socialShare'
import { canShareFiles } from '../utils/domImageCapture'

/** プレビュー中の画像1枚分のファイルとObject URL */
export type ImagePreviewItem = {
  /** 保存・共有に使う画像ファイル */
  file: File
  /** プレビュー表示に使うObject URL */
  url: string
}

/** 画像プレビュー・共有ダイアログの状態を初期化するための画面固有の設定 */
export type ImagePreviewOptions<TCaptureResult> = {
  /** 画像を生成する。 */
  capture: () => Promise<TCaptureResult>
  /** 生成結果をプレビューする画像ファイルへ変換する。破棄済みの生成結果には呼ばれない。 */
  toFiles: (result: TCaptureResult) => File[]
  /** 画像生成を開始できるか。省略時は常に開始できる。 */
  canCapture?: Accessor<boolean>
  /** 画像生成中もダイアログを閉じられないようにするか。省略時は共有中のみ閉じられない。 */
  lockCloseWhileCapturing?: boolean
  /** ダイアログの開閉時に画面固有の状態を初期化する。プレビュー破棄と同じバッチ内で呼ばれる。 */
  onOpenChange?: (nextOpen: boolean) => void
  /** 画像生成に失敗した場合のエラー文言 */
  captureErrorMessage: string
  /** 共有に失敗した場合のエラー文言 */
  shareErrorMessage: string
  /** Web Share APIへ渡すタイトル */
  shareTitle: string
}

/** 画像プレビュー・共有ダイアログの状態と操作 */
export type ImagePreviewState = {
  /** ダイアログを開いているか */
  open: Accessor<boolean>
  /** 画像を生成中か */
  isCapturing: Accessor<boolean>
  /** 共有中か */
  isSharing: Accessor<boolean>
  /** 画像の生成または共有を実行中か */
  isBusy: Accessor<boolean>
  /** ダイアログを閉じられない状態か */
  isCloseLocked: Accessor<boolean>
  /** 生成済みのプレビュー画像。未生成の場合は空配列 */
  previews: Accessor<ImagePreviewItem[]>
  /** 画像生成のエラー文言 */
  captureError: Accessor<string | undefined>
  /** 共有のエラー文言 */
  shareError: Accessor<string | undefined>
  /** ダイアログの開閉状態を更新し、プレビューとエラーを破棄する。 */
  handleOpenChange: (nextOpen: boolean) => void
  /** 生成中の結果とプレビューを破棄し、条件が揃い次第再生成させる。 */
  reset: () => void
  /** 画像生成に失敗した後、生成をやり直す。 */
  retryCapture: () => void
  /** 指定した画像ファイルをWeb Share APIで共有する。 */
  share: (files: File[]) => Promise<void>
}

/**
 * 共有シートをユーザーが閉じたことによる中断か判定する。
 *
 * @param error - `navigator.share` が送出した例外。
 * @returns ユーザー操作による中断の場合はtrue。
 */
const isShareAborted = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError'

/**
 * プレビュー用Object URLを解放する。
 *
 * @param items - 解放するプレビュー画像。
 * @returns なし。
 */
const revokeItems = (items: ImagePreviewItem[]): void => {
  for (const item of items) URL.revokeObjectURL(item.url)
}

/**
 * 画像プレビュー・共有ダイアログの状態管理と副作用をまとめた Primitive を生成する。
 *
 * ダイアログを開くと条件が揃い次第自動で画像を生成し、開閉・再生成・破棄時には
 * 古い生成結果を捨ててObject URLを解放する。生成に失敗した場合は自動生成を止め、
 * `retryCapture` で再試行できる。
 *
 * @param options - 画像生成処理、ファイル変換処理、エラー文言など画面固有の設定。
 * @returns 開閉状態、プレビュー画像、エラー、生成・共有操作。
 */
export const createImagePreview = <TCaptureResult>(
  options: ImagePreviewOptions<TCaptureResult>
): ImagePreviewState => {
  const [open, setOpen] = createSignal(false)
  const [isCapturing, setIsCapturing] = createSignal(false)
  const [isSharing, setIsSharing] = createSignal(false)
  const [previews, setPreviews] = createSignal<ImagePreviewItem[]>([])
  const [captureError, setCaptureError] = createSignal<string>()
  const [shareError, setShareError] = createSignal<string>()
  let captureRevision = 0

  /**
   * 画面固有の条件で画像生成を開始できるか返す。
   *
   * @returns 生成を開始できる場合はtrue。
   */
  const canCapture = (): boolean => options.canCapture?.() ?? true

  /**
   * 画像の生成または共有を実行中か返す。
   *
   * @returns 実行中の場合はtrue。
   */
  const isBusy = (): boolean => isCapturing() || isSharing()

  /**
   * ダイアログを閉じられない状態か返す。
   *
   * @returns 共有中、または設定により生成中の場合はtrue。
   */
  const isCloseLocked = (): boolean =>
    isSharing() || (options.lockCloseWhileCapturing === true && isCapturing())

  /**
   * 生成中の結果とプレビュー、エラーを破棄する。
   *
   * @returns なし。
   */
  const reset = (): void => {
    batch(() => {
      captureRevision += 1
      setIsCapturing(false)
      revokeItems(previews())
      setPreviews([])
      setCaptureError(undefined)
      setShareError(undefined)
    })
  }

  /**
   * ダイアログの開閉状態を更新し、一時画像とエラーを破棄する。
   *
   * @param nextOpen - 次のダイアログ開閉状態。
   * @returns なし。
   */
  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen && isCloseLocked()) return

    batch(() => {
      reset()
      options.onOpenChange?.(nextOpen)
      setOpen(nextOpen)
    })
  }

  /**
   * 画像を生成してObject URLを作り、最新の生成結果だけをプレビューへ反映する。
   *
   * @returns 生成処理の完了時に解決されるPromise。
   */
  const capture = async (): Promise<void> => {
    if (!open() || isCapturing() || previews().length > 0 || !canCapture()) return

    const revision = ++captureRevision
    setIsCapturing(true)
    setCaptureError(undefined)
    setShareError(undefined)

    try {
      const result = await options.capture()
      if (revision !== captureRevision || !open()) return

      const items: ImagePreviewItem[] = []
      try {
        for (const file of options.toFiles(result)) {
          items.push({ file, url: URL.createObjectURL(file) })
        }
        setPreviews(items)
      } catch (error) {
        revokeItems(items)
        throw error
      }
    } catch {
      if (revision === captureRevision) setCaptureError(options.captureErrorMessage)
    } finally {
      if (revision === captureRevision) setIsCapturing(false)
    }
  }

  /**
   * 画像生成に失敗した後、生成をやり直す。
   *
   * @returns なし。
   */
  const retryCapture = (): void => {
    void capture()
  }

  /**
   * 指定した画像ファイルをWeb Share APIで共有する。共有シートを閉じた場合はエラーにしない。
   *
   * @param files - 共有する画像ファイル。
   * @returns 共有処理の完了時に解決されるPromise。
   */
  const share = async (files: File[]): Promise<void> => {
    if (isBusy()) return
    if (!canShareFiles(files)) {
      setShareError(options.shareErrorMessage)
      return
    }

    setIsSharing(true)
    setShareError(undefined)
    try {
      await navigator.share({ files, text: SOCIAL_SHARE_TEXT, title: options.shareTitle })
    } catch (error) {
      if (!isShareAborted(error)) setShareError(options.shareErrorMessage)
    } finally {
      setIsSharing(false)
    }
  }

  onCleanup(() => {
    captureRevision += 1
    revokeItems(previews())
  })

  // ダイアログ表示中にプレビューがなく、生成条件が揃っていれば自動で画像化する。
  createEffect(() => {
    if (!open() || previews().length > 0 || captureError() || isCapturing() || !canCapture()) {
      return
    }

    untrack(() => void capture())
  })

  return {
    open,
    isCapturing,
    isSharing,
    isBusy,
    isCloseLocked,
    previews,
    captureError,
    shareError,
    handleOpenChange,
    reset,
    retryCapture,
    share,
  }
}

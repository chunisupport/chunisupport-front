import { batch, createSignal } from 'solid-js'
import { resolveComposingSearchQuery } from '../utils/searchUtils'

type CreateComposingSearchInputOptions = {
  /** 親が保持している検索文字列 */
  value: () => string
  /** 検索に使う文字列の更新先。変換中は末尾の全角英字を除いた値になる */
  onChange: (value: string) => void
}

/**
 * IME変換中の表示文字列と、検索へ渡す文字列を分ける。
 * 入力欄には未確定の全文を残し、検索値だけ末尾の全角英字を外す。
 *
 * @param options 親の検索文字列と更新関数
 * @returns 入力欄へ渡す表示値と、変更・変換開始・変換終了のハンドラー
 */
export const createComposingSearchInput = (options: CreateComposingSearchInputOptions) => {
  const [composing, setComposing] = createSignal(false)
  const [draft, setDraft] = createSignal('')

  const displayedValue = () => (composing() ? draft() : options.value())

  /**
   * 入力値の変更を、変換中なら末尾の全角英字を外して親へ伝える。
   *
   * @param value 入力欄の現在値
   */
  const handleChange = (value: string) => {
    if (composing()) setDraft(value)
    options.onChange(resolveComposingSearchQuery(value, composing()))
  }

  /**
   * IME変換の開始時に、表示用の下書きを残して検索値から末尾の全角英字を外す。
   *
   * @param value 変換開始時点の入力欄の値
   */
  const beginComposition = (value: string) => {
    batch(() => {
      setDraft(value)
      setComposing(true)
      options.onChange(resolveComposingSearchQuery(value, true))
    })
  }

  /**
   * IME変換の確定値を、末尾の全角英字を残したまま親へ伝える。
   *
   * @param value 確定した入力欄の値
   */
  const endComposition = (value: string) => {
    if (!composing()) return
    batch(() => {
      setComposing(false)
      options.onChange(value)
    })
  }

  return {
    displayedValue,
    handleChange,
    beginComposition,
    endComposition,
  }
}

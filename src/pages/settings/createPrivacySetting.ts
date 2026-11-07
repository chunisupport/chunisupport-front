import { type Accessor, createEffect, createSignal } from 'solid-js'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { PRIVACY_SETTINGS_COPY } from './ProfileSettings.constants.ts'

/** APIが返すプロフィール公開設定 */
type PrivacyResult = { is_private: boolean }

type PrivacySettingOptions = {
  /** 設定画面で取得済みの非公開状態。未取得の間は undefined */
  source: Accessor<boolean | undefined>
  /** 非公開状態を保存する */
  update: (isPrivate: boolean) => Promise<PrivacyResult>
  /** 保存失敗後にサーバー側の最新状態を取得する */
  refresh: () => Promise<PrivacyResult>
  /** 保存に成功した非公開状態を設定画面の取得済みデータへ反映する */
  onSaved: (isPrivate: boolean) => void
}

/**
 * プロフィール非公開設定の切り替えと、保存中・成功・失敗の表示状態を管理する。
 * 切り替え直後に表示へ反映し、保存に失敗した場合は直前の状態へ戻してからサーバーの最新状態に合わせる。
 *
 * @param options - 取得済みの非公開状態と、保存・再取得・反映の処理。
 * @returns 表示中の非公開状態、保存中か、成功・失敗の文言、および切り替え関数。
 */
export const createPrivacySetting = (options: PrivacySettingOptions) => {
  const [value, setValue] = createSignal(false)
  const [submitting, setSubmitting] = createSignal(false)
  const [error, setError] = createSignal('')
  const [success, setSuccess] = createSignal('')

  createEffect(() => {
    const source = options.source()
    if (source !== undefined) setValue(source)
  })

  /**
   * 非公開状態を切り替えて保存する。保存中に重ねて呼ばれた場合は何もしない。
   *
   * @param nextValue - 切り替え後の非公開状態。
   * @returns 保存と失敗時の再取得が完了した後に解決されるPromise。
   */
  const toggle = async (nextValue: boolean): Promise<void> => {
    if (submitting()) return

    setError('')
    setSuccess('')
    const previousValue = value()
    setValue(nextValue)
    setSubmitting(true)
    try {
      const result = await options.update(nextValue)
      setValue(result.is_private)
      options.onSaved(result.is_private)
      setSuccess(PRIVACY_SETTINGS_COPY.success)
    } catch (caught) {
      setValue(previousValue)
      setError(toUserFriendlyErrorMessage(caught, PRIVACY_SETTINGS_COPY.failure))
      // 再取得にも失敗した場合は、直前の状態のまま保存失敗だけを伝える。
      const latest = await options.refresh().catch(() => undefined)
      if (latest) setValue(latest.is_private)
    } finally {
      setSubmitting(false)
    }
  }

  return { value, submitting, error, success, toggle }
}

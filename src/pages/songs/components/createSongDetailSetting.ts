import { type Accessor, createMemo, createResource, createSignal, onCleanup } from 'solid-js'
import { toUserFriendlyErrorMessage } from '../../../utils/errorMessage'

type SongSettingSource = {
  username: string
  songId: string
}

type SettingResult<T> = {
  source: SongSettingSource
  value: T | undefined
  error: string | undefined
}

type Options<T> = {
  username: Accessor<string | undefined>
  songId: Accessor<string>
  load: (source: SongSettingSource) => Promise<T>
  save: (current: T, next: T, source: SongSettingSource) => Promise<void>
  loadError: string
  saveError: string
}

/**
 * 楽曲とユーザーに対応する設定を取得し、保存成功後に更新する。
 *
 * @param options - 対象ユーザーと楽曲、取得・保存処理、エラー文言。
 * @returns 設定値、操作可否、処理状態、エラー、および保存関数。
 */
export const createSongDetailSetting = <T>(options: Options<T>) => {
  const source = createMemo(() => {
    const username = options.username()
    return username ? { username, songId: options.songId() } : null
  })
  const [saving, setSaving] = createSignal(false)
  const [saveError, setSaveError] = createSignal<{ source: SongSettingSource; message: string }>()
  let active = true
  onCleanup(() => {
    active = false
  })
  const [setting, { mutate }] = createResource(
    source,
    async (currentSource): Promise<SettingResult<T>> => {
      try {
        return { source: currentSource, value: await options.load(currentSource), error: undefined }
      } catch (error) {
        return {
          source: currentSource,
          value: undefined,
          error: toUserFriendlyErrorMessage(error, options.loadError),
        }
      }
    }
  )
  const currentSetting = () => {
    const current = setting()
    return current?.source === source() ? current : undefined
  }
  const busy = () => setting.loading || saving()
  const disabled = () => !currentSetting() || Boolean(currentSetting()?.error) || busy()
  const errorMessage = () =>
    (saveError()?.source === source() ? saveError()?.message : undefined) ?? currentSetting()?.error

  /**
   * 設定を保存し、同じ楽曲とユーザーを表示中の場合にだけ結果を反映する。
   *
   * @param next - 保存する設定値。
   * @returns 保存処理完了時に解決するPromise。
   */
  const save = async (next: T): Promise<void> => {
    const current = currentSetting()
    if (!current || current.value === undefined || disabled()) return

    setSaving(true)
    setSaveError(undefined)
    try {
      await options.save(current.value, next, current.source)
      if (active && current.source === source()) {
        mutate({ ...current, value: next })
      }
    } catch (error) {
      if (active && current.source === source()) {
        setSaveError({
          source: current.source,
          message: toUserFriendlyErrorMessage(error, options.saveError),
        })
      }
    } finally {
      if (active) setSaving(false)
    }
  }

  return { value: () => currentSetting()?.value, busy, disabled, errorMessage, save }
}

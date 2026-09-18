import { Tooltip } from '@kobalte/core/tooltip'
import { CornerDownLeft } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createEffect, createSignal, createUniqueId, Show } from 'solid-js'
import { AppIconButton } from '../../../components/common/AppButton'
import { SONG_EDIT_COPY } from '../songEditConstants'
import {
  findStandardSongBpm,
  findStandardSongReading,
  type StandardSongLookupItem,
} from '../utils/standardSongLookup'

type CopyFromStandardFieldBaseProps = {
  /** グリッド配置などに使う追加クラス */
  class?: string
  /** 照合に使うSTANDARD楽曲一覧 */
  songs: readonly StandardSongLookupItem[]
  /** WORLD'S END側の曲名 */
  title: string
  /** WORLD'S END側のアーティスト名 */
  artist: string
  /** STANDARD楽曲一覧の読み込み中かどうか */
  songsLoading?: boolean
  /** 取り込み対象の入力欄 */
  children: JSX.Element
}

type CopyFromStandardFieldProps =
  | (CopyFromStandardFieldBaseProps & {
      /** STANDARDから取り込む項目 */
      field: 'bpm'
      /** 取得したBPMを入力欄へ反映する処理 */
      onCopied: (value: number) => void
    })
  | (CopyFromStandardFieldBaseProps & {
      /** STANDARDから取り込む項目 */
      field: 'reading'
      /** 取得した読みを入力欄へ反映する処理 */
      onCopied: (value: string) => void
    })

/**
 * 取り込み対象に応じたボタンラベルと未設定時メッセージを返す。
 *
 * @param field - STANDARDから取り込む項目。
 * @returns アクセシブル名と値が未設定のときの文言。
 */
const getCopyFromStandardCopy = (
  field: CopyFromStandardFieldProps['field']
): { ariaLabel: string; valueMissingMessage: string } =>
  field === 'bpm'
    ? {
        ariaLabel: SONG_EDIT_COPY.copyBpmFromStandardAriaLabel,
        valueMissingMessage: SONG_EDIT_COPY.copyBpmFromStandardBpmMissing,
      }
    : {
        ariaLabel: SONG_EDIT_COPY.copyReadingFromStandardAriaLabel,
        valueMissingMessage: SONG_EDIT_COPY.copyReadingFromStandardMissing,
      }

/**
 * WORLD'S ENDの入力欄の右に、STANDARD楽曲から値を取り込むボタンを置く。
 *
 * @param props - 照合対象の楽曲、曲名・アーティスト名、入力欄、反映ハンドラ。
 * @returns 入力欄と取り込みボタンを横並びにしたUI。
 */
const CopyFromStandardField = (props: CopyFromStandardFieldProps): JSX.Element => {
  const errorId = createUniqueId()
  const [errorMessage, setErrorMessage] = createSignal('')
  const copy = () => getCopyFromStandardCopy(props.field)

  createEffect((previousLookupKey?: string) => {
    const lookupKey = `${props.field}\0${props.title}\0${props.artist}`
    if (previousLookupKey !== lookupKey) {
      setErrorMessage('')
    }
    return lookupKey
  })

  /**
   * 曲名・アーティスト名が空、またはSTANDARD楽曲の読み込み中ならボタンを無効化する。
   *
   * @returns 無効化する場合は true。
   */
  const isCopyDisabled = (): boolean =>
    Boolean(props.songsLoading) || props.title.trim() === '' || props.artist.trim() === ''

  /**
   * 同じ曲名・アーティスト名のSTANDARD楽曲から値を入力欄へ取り込む。
   *
   * @returns なし。
   */
  const handleCopy = (): void => {
    setErrorMessage('')
    if (props.field === 'bpm') {
      const result = findStandardSongBpm(props.songs, props.title, props.artist)
      if (result.status === 'found') {
        props.onCopied(result.value)
        return
      }
      setErrorMessage(
        result.status === 'valueMissing'
          ? copy().valueMissingMessage
          : SONG_EDIT_COPY.copyFromStandardNotFound
      )
      return
    }

    const result = findStandardSongReading(props.songs, props.title, props.artist)
    if (result.status === 'found') {
      props.onCopied(result.value)
      return
    }
    setErrorMessage(
      result.status === 'valueMissing'
        ? copy().valueMissingMessage
        : SONG_EDIT_COPY.copyFromStandardNotFound
    )
  }

  return (
    <div class={props.class}>
      <div class="flex items-end gap-2 [&_input]:h-9.5">
        <div class="min-w-0 flex-1">{props.children}</div>
        <Tooltip placement="top" gutter={4} openDelay={400}>
          <Tooltip.Trigger
            as={AppIconButton}
            class="h-9.5 w-9.5 shrink-0"
            disabled={isCopyDisabled()}
            aria-label={copy().ariaLabel}
            aria-describedby={errorMessage() ? errorId : undefined}
            onClick={handleCopy}
          >
            <CornerDownLeft class="h-4 w-4" aria-hidden="true" />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content class="z-60 rounded-md border border-border-strong bg-surface-raised px-2 py-1 text-xs text-text shadow-lg">
              {copy().ariaLabel}
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip>
      </div>
      <Show when={errorMessage()}>
        {(message) => (
          <p id={errorId} class="mt-1 text-sm text-danger">
            {message()}
          </p>
        )}
      </Show>
    </div>
  )
}

export default CopyFromStandardField

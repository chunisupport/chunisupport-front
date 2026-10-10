import { TextField } from '@kobalte/core/text-field'
import { Tooltip } from '@kobalte/core/tooltip'
import { CornerDownLeft, ExternalLink } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { WIKI_BASE_URL } from '../../config'
import { SONG_EDIT_INPUT_LIMITS } from '../../constants/songMaster'
import { buildWikiPageUrl, generateWikiPageTitle } from '../../utils/wiki'
import { AppIconButton } from './AppButton'
import { WIKI_PAGE_TITLE_FIELD_COPY as COPY } from './WikiPageTitleField.constants'

type WikiPageTitleFieldProps = {
  /** 生成元の曲名 */
  title: string
  /** 入力欄の表示ラベル */
  label: string
  /** 入力中のWikiページタイトル */
  value: string
  /** グリッド配置などの追加クラス */
  class?: string
  /** 画面の入力欄スタイル */
  inputClass: string
  /** 入力値を反映する処理 */
  onInput: (value: string) => void
  /** 曲名生成ボタンより前に置く追加操作（STANDARDからの取り込みボタンなど） */
  leadingAction?: JSX.Element
}

/**
 * Wikiページタイトル入力欄に曲名からの生成と外部ページ確認の操作を添える。
 *
 * @param props - 曲名、入力値、ラベル、スタイル、変更ハンドラ、先頭に置く追加操作。
 * @returns 入力欄とツールチップ付き操作ボタン。
 */
const WikiPageTitleField = (props: WikiPageTitleFieldProps): JSX.Element => {
  const pageUrl = () => buildWikiPageUrl(WIKI_BASE_URL, props.value)

  /**
   * 保存前の入力値に対応するWikiページを別タブで開く。
   *
   * @returns なし。
   */
  const openPage = (): void => {
    const url = pageUrl()
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div class={props.class}>
      <div class="flex items-end gap-2 [&_input]:h-9.5">
        <TextField class="min-w-0 flex-1 text-sm">
          <TextField.Label class="mb-1 block text-text-muted">{props.label}</TextField.Label>
          <TextField.Input
            value={props.value}
            maxLength={SONG_EDIT_INPUT_LIMITS.wikiPageTitle}
            class={props.inputClass}
            onInput={(event) => props.onInput(event.currentTarget.value)}
          />
        </TextField>
        {props.leadingAction}
        <Tooltip placement="top" gutter={4} openDelay={400}>
          <Tooltip.Trigger
            as={AppIconButton}
            class="h-9.5 w-9.5 shrink-0 focus-visible:ring-inset"
            disabled={!props.title.trim()}
            aria-label={COPY.generate}
            onClick={() => props.onInput(generateWikiPageTitle(props.title))}
          >
            <CornerDownLeft class="h-4 w-4" aria-hidden="true" />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content class="z-60 rounded-md border border-border-strong bg-surface-raised px-2 py-1 text-xs text-text shadow-lg">
              {COPY.generate}
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip>
        <Tooltip placement="top" gutter={4} openDelay={400}>
          <Tooltip.Trigger
            as={AppIconButton}
            class="h-9.5 w-9.5 shrink-0 focus-visible:ring-inset"
            disabled={!pageUrl()}
            aria-label={COPY.open}
            onClick={openPage}
          >
            <ExternalLink class="h-4 w-4" aria-hidden="true" />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content class="z-60 rounded-md border border-border-strong bg-surface-raised px-2 py-1 text-xs text-text shadow-lg">
              {COPY.open}
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip>
      </div>
    </div>
  )
}

export default WikiPageTitleField

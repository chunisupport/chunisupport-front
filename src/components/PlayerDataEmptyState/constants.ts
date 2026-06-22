import { BOOKMARKLET_BASE_URL, BOOKMARKLET_ENTRYPOINT } from '../../config'

/**
 * プレイヤーデータ登録用スクリプトを読み込むブックマークレット。
 */
export const CHUNISUPPORT_BOOKMARKLET = `javascript:(function(){var e=document.createElement("script");e.src="${new URL(BOOKMARKLET_ENTRYPOINT, BOOKMARKLET_BASE_URL)}";document.body.appendChild(e)})();`

/**
 * プレイヤーデータ未登録案内で利用する表示文言。
 */
export const PLAYER_DATA_EMPTY_STATE_TEXT = {
  bookmarkletTitle: 'ブックマークレット',
  bookmarkletDescription: '以下のブックマークレットをブラウザのブックマークに登録してください。',
  copyButton: 'コピー',
  copiedLabel: 'コピーしました',
  copyFailedLabel: 'コピーに失敗しました。手動でコピーしてください。',
} as const

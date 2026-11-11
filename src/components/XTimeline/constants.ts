/** Xタイムラインのセクション見出し */
export const X_TIMELINE_HEADING = 'X公式アカウント'

/** Xの埋め込みウィジェット用スクリプトURL */
export const X_TIMELINE_SCRIPT_SRC = 'https://platform.x.com/widgets.js'

/** ChuniSupport公式XアカウントのURL */
export const X_TIMELINE_ACCOUNT_URL = 'https://x.com/chunisupport?ref_src=twsrc%5Etfw'

/** Xウィジェットを読み込めない場合に表示するリンク文言 */
export const X_TIMELINE_LINK_TEXT = 'ChuniSupport公式Xを開く'

/**
 * 埋め込みタイムラインの表示高さ（px）。
 * widgets.js の data-height 既定値に合わせ、iframe の高さ変化で後続要素が動かないようにする。
 */
export const X_TIMELINE_HEIGHT_PX = 600

/**
 * ビューポート下端よりこの距離（px）以内なら、タイムラインへ近づいたとみなす。
 */
export const X_TIMELINE_APPROACH_MARGIN_PX = 240

/**
 * スクロールなしで読み込んでよい、予約領域の表示割合。
 * これ未満は画面外に近いので、初回ロードでは widgets.js を取得しない。
 */
export const X_TIMELINE_EAGER_VISIBLE_RATIO = 0.15

/**
 * IntersectionObserver の rootMargin。
 * 下方向だけ手前で交差させ、予約領域がビューポートへ入る前に判定を始める。
 */
export const X_TIMELINE_LOAD_ROOT_MARGIN = `0px 0px ${X_TIMELINE_APPROACH_MARGIN_PX}px 0px`

/**
 * 表示判定のあと、アイドル時に widgets.js の読み込みを始めるまでの上限（ms）。
 */
export const X_TIMELINE_IDLE_TIMEOUT_MS = 1000

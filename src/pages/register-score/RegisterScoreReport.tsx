import type { JSX, Ref } from 'solid-js'
import { SiteLogoMark } from '../../components/common/SiteLogoMark'
import type { NormalizedPlayerDataUpdateResult } from '../../usecases/registerScoreCommit'
import { REGISTER_SCORE_COPY } from './constants'
import { formatRegisterScoreImportedAt } from './registerScoreDisplay'

/** 更新差分レポートヘッダに表示するロゴの色 */
const REGISTER_SCORE_REPORT_LOGO_COLOR = '#444444'

/**
 * スコア登録結果のヘッダーを表示する。
 *
 * @param props - APIから返却された登録結果。
 * @returns レポートヘッダー。
 */
const RegisterScoreReportHeader = (props: { result: NormalizedPlayerDataUpdateResult }) => (
  <header class="flex items-center justify-between border-b border-border bg-surface-muted px-3 py-3">
    <SiteLogoMark
      class="h-12 w-12"
      style={{ 'background-color': REGISTER_SCORE_REPORT_LOGO_COLOR }}
    />
    <div class="min-w-0 text-right">
      <h1 class="whitespace-nowrap text-2xl font-bold">{REGISTER_SCORE_COPY.reportTitle}</h1>
      <p class="mt-1 text-sm">
        <span class="whitespace-nowrap font-jost">
          {formatRegisterScoreImportedAt(props.result.imported_at)}
        </span>
      </p>
    </div>
  </header>
)

/**
 * 画像化する更新差分レポートの原寸DOMを表示する。
 *
 * `ref` で受け取る要素が画像化の起点になる。画像化処理は表示用transformを持たない複製を作り、
 * `data-score-image-body` 直下のうち `data-score-image-section` 以外の要素を1ページ目の先頭へ、
 * `data-score-image-section` をカード単位でページへ配置する。
 * 画面だけで使う操作部品には `data-image-capture-excluded` を付けて画像から除外する。
 *
 * @param props - 画像化の起点となる要素の参照、ヘッダーへ表示する登録結果、およびレポート本文。
 * @returns ライトテーマに固定した更新差分レポート。
 */
export const RegisterScoreReport = (props: {
  ref: Ref<HTMLElement>
  result: NormalizedPlayerDataUpdateResult
  children: JSX.Element
}) => (
  <section
    ref={props.ref}
    data-theme="light"
    class="w-full overflow-hidden rounded-md border border-border bg-surface px-0 pb-4 pt-0 font-sans text-text shadow-sm"
  >
    <RegisterScoreReportHeader result={props.result} />
    <div class="px-4 pt-3" data-score-image-body>
      {props.children}
    </div>
  </section>
)

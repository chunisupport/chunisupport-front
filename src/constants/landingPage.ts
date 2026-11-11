/**
 * 未ログイン時の導入カード。
 * 認証確認中の表示も同じ最小高さにし、下のお知らせとX欄が動かないようにする。
 * 幅360〜767pxでは説明が2行で約11.5rem、768px以上では1行で約10.25remになる。
 */
export const LANDING_GUEST_HERO_SECTION_CLASS =
  'min-h-[11.5rem] rounded-lg border border-border bg-surface p-6 md:min-h-[10.25rem]'

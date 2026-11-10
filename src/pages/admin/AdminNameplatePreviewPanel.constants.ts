/** プロフィールカード確認画面の文言 */
export const ADMIN_NAMEPLATE_PREVIEW_COPY = {
  nameLabel: 'プレイヤー名',
  emblemLabel: 'エンブレム',
  emblemBaseLabel: '台座',
  possessionLabel: 'ポゼッション',
  widthLabel: '幅',
  emblemListHeading: 'エンブレム一覧',
  possessionListHeading: 'ポゼッション一覧',
} as const

/** プレイヤー名の最大文字数。ゲーム内の上限に合わせる */
export const NAMEPLATE_PREVIEW_NAME_MAX_LENGTH = 8

/** 文字数確認用のプレイヤー名プリセット */
export const NAMEPLATE_PREVIEW_NAME_PRESETS = [
  { label: '1文字', value: 'A' },
  { label: '半角8文字', value: 'WWWWWWWW' },
  { label: '全角8文字', value: 'あいうえおかきく' },
  { label: '記号8文字', value: '★☆♪♭◆■●▲' },
] as const

/** エンブレム・台座の選択肢。value が null のものは未設定 */
export const NAMEPLATE_PREVIEW_EMBLEM_OPTIONS = [
  { label: 'なし', value: null },
  { label: 'I', value: '1' },
  { label: 'II', value: '2' },
  { label: 'III', value: '3' },
  { label: 'IV', value: '4' },
  { label: 'V', value: '5' },
  { label: '∞', value: 'inf' },
] as const

/** 確認用カード幅の選択肢。value が undefined のものは既定幅 */
export const NAMEPLATE_PREVIEW_WIDTH_OPTIONS = [
  { label: '既定', value: undefined },
  { label: '狭い (16rem)', value: 'w-64' },
  { label: 'スマホ幅 (20rem)', value: 'w-80' },
] as const

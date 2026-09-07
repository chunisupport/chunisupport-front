/** 楽曲詳細のマスタ編集UIで使用する表示文言 */
export const SONG_EDIT_COPY = {
  editSongAriaLabel: '楽曲情報を編集',
  editChartAriaLabel: '譜面情報を編集',
  songDialogTitle: '楽曲情報を編集',
  chartDialogTitle: '譜面情報を編集',
  songFormDescription: 'ジャンル、BPM、リリース日を編集します。',
  chartFormDescription: '譜面定数、ノーツ数、ノーツデザイナーを編集します。',
  worldsendChartFormDescription: '属性、レベル、ノーツ数、ノーツデザイナーを編集します。',
  genreLabel: 'GENRE',
  bpmLabel: 'BPM',
  releaseLabel: 'RELEASE',
  constLabel: 'CONST',
  constUnknownLabel: '定数不明',
  notesLabel: 'NOTES',
  notesDesignerLabel: 'NOTES DESIGNER',
  attributeLabel: '属性',
  levelLabel: 'LEVEL',
  genrePlaceholder: '選択してください',
  cancelButton: 'キャンセル',
  saveButton: '保存',
  savingButton: '保存中...',
  songUpdateSuccess: '楽曲情報を更新しました。',
  chartUpdateSuccess: '譜面情報を更新しました。',
  songUpdateError: '楽曲情報の更新に失敗しました。',
  chartUpdateError: '譜面情報の更新に失敗しました。',
  genreRequired: 'ジャンルを選択してください。',
  bpmInvalid: 'BPMは0以上の整数で入力してください。',
  releaseInvalid: 'リリース日の形式が不正です。日付を入力し直してください。',
  constInvalid: '譜面定数は0以上で入力してください。',
  notesInvalid: 'ノーツは0以上の整数で入力してください。',
  notesDesignerTooLong: 'NOTES DESIGNERは100文字以下で入力してください。',
  levelInvalid: "WORLD'S ENDレベルは1〜5で入力してください。",
} as const

/** 楽曲詳細のマスタ編集フォームの入力上限 */
export const SONG_EDIT_INPUT_LIMITS = {
  notesDesigner: 100,
} as const

/** 楽曲詳細のマスタ編集フォームで使うテキスト入力の共通スタイル */
export const SONG_EDIT_TEXT_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-surface px-3 py-2 font-sans hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-text-muted'

/** 楽曲詳細のマスタ編集フォームで使う数値入力の共通スタイル */
export const SONG_EDIT_NUMBER_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-surface px-3 py-2 hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

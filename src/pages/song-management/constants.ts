/** 楽曲管理画面の操作ボタン文言 */
export const SONG_MANAGEMENT_ACTION_COPY = {
  update: '更新',
  delete: '削除',
  restore: '復活',
  addStandard: '通常楽曲を追加',
  addWorldsend: "WORLD'S END楽曲を追加",
  addUltimaChart: 'ULTIMA譜面を追加',
} as const

/** 楽曲管理画面の見出し・説明文言 */
export const SONG_MANAGEMENT_SECTION_COPY = {
  description: "API仕様準拠: 通常楽曲・WORLD'S END ともに追加・編集・削除・復活に対応します。",
  standardEdit: '通常楽曲（編集 / 削除 / 復活）',
  worldsendEdit: "WORLD'S END（編集 / 削除 / 復活）",
  standardCreate: '通常楽曲を追加',
  worldsendCreate: "WORLD'S END楽曲を追加",
  worldsendEmpty: "WORLD'S END楽曲がありません。",
  searchPlaceholder: '曲名・アーティスト名で検索',
} as const

/** 楽曲管理画面の入力項目文言 */
export const SONG_MANAGEMENT_FIELD_COPY = {
  officialIdx: '公式ID',
  officialIdxPlaceholder: '1234567890',
  updatedAt: '更新日時',
  chartUpdatedAt: '譜面更新日時',
  title: 'タイトル',
  reading: '読み',
  artist: 'アーティスト',
  wikiPageTitle: 'Wikiページタイトル',
  genre: 'ジャンル',
  genreEditPlaceholder: '未設定',
  genreCreatePlaceholder: '選択してください',
  bpm: 'BPM',
  releasedAt: 'リリース日',
  jacket: 'ジャケットID',
  isNew: '新曲フラグ',
  attribute: '属性',
  level: 'レベル',
  notes: 'ノーツ',
  notesDesigner: 'NOTES DESIGNER',
  chartEnabled: '追加',
  difficulty: '難易度',
  const: '定数',
  constUnknown: '未確定',
} as const

/** 楽曲管理画面の入力上限 */
export const SONG_MANAGEMENT_INPUT_LIMITS = {
  officialIdx: 10,
  reading: 300,
} as const

/** 楽曲管理画面の操作結果・検証エラー文言 */
export const SONG_MANAGEMENT_MESSAGES = {
  masterDataMissingForUpdate:
    'マスターデータの取得前のため更新できません。再読み込みしてください。',
  masterDataMissingForCreate:
    'マスターデータの取得前のため追加できません。再読み込みしてください。',
  masterDataMissingForUltima: 'マスターデータの取得前のためULTIMA譜面を追加できません。',
  ultimaDifficultyMissing: 'ULTIMA難易度のマスターデータが見つかりません。',
  releaseInvalid: 'リリース日の形式が不正です。日付を入力し直してください。',
  editableChartInvalid: '譜面の定数・ノーツは0以上で入力してください。',
  createChartInvalid: '追加する譜面の定数・ノーツは0以上で入力してください。',
  requiredFieldsMissing: '公式ID・タイトル・アーティストは必須です。',
  officialIdxTooLong: '公式IDは10文字以内で入力してください。',
  genreRequired: 'ジャンルを選択してください。',
  bpmInvalid: 'BPMは0以上で入力してください。',
  levelInvalid: "WORLD'S ENDレベルは1〜5で入力してください。",
  notesInvalid: 'ノーツは0以上で入力してください。',
  updateError: '更新に失敗しました。',
  createError: '追加に失敗しました。',
  deleteError: '削除に失敗しました。',
  restoreError: '復活に失敗しました。',
  standardUpdated: '楽曲を更新しました。',
  standardCreated: '通常楽曲を追加しました。',
  standardDeleted: '楽曲を削除しました。',
  standardRestored: '楽曲を復活しました。',
  standardDeleteConfirm: 'この楽曲を削除しますか？',
  worldsendUpdated: "WORLD'S END楽曲を更新しました。",
  worldsendCreated: "WORLD'S END楽曲を追加しました。",
  worldsendDeleted: "WORLD'S END楽曲を削除しました。",
  worldsendRestored: "WORLD'S END楽曲を復活しました。",
  worldsendDeleteConfirm: "このWORLD'S END楽曲を削除しますか？",
} as const

import type { AppTabOption } from '../../components/common/AppTabs'

/** 筐体表示を照合する分類軸。 */
export type LockedSongDiscoveryAxis = 'genre' | 'version' | 'nameFolder' | 'level'

/** 未解禁曲ディスカバーの画面文言。タイトルと説明文はツール一覧の定義を参照すること。 */
export const LOCKED_SONG_DISCOVERY_COPY = {
  dataLoading: '照合用データを読み込み中',
  prerequisitesLabel: '以下の条件を満たしていますか？',
  prerequisiteTicket: '全難易度プレイチケットを使用している',
  prerequisiteMaster: '選曲画面でMASTERを選択している',
  observedOverPower: '筐体OP',
  observedPercent: '筐体OP%',
  matched: '一致',
  mismatched: '差異あり',
  invalid: '入力エラー',
  empty: '未入力',
  axisSelect: '分類軸',
  clearInputs: '入力を消去',
  clearInputsAriaLabel: '表示中の分類の入力を消去',
  candidateTitle: '未解禁候補曲',
  songCountUnit: '曲',
  candidateEmpty: '差がある分類を入力すると、ここに候補が表示されます',
  candidateNotFound: '入力内容に一致する候補曲はありません',
  openRecords: '候補曲をレコードで表示',
  jumpToCandidates: '候補曲へ移動',
  recordNavigationError: '候補曲のレコード画面を開けませんでした。',
  recordIncomplete: '照合に必要な未プレイを含む譜面レコードが不足しています。',
} as const

/** 入力対象を切り替える分類軸の選択肢。 */
export const LOCKED_SONG_DISCOVERY_AXIS_OPTIONS: readonly AppTabOption<LockedSongDiscoveryAxis>[] =
  [
    { value: 'genre', label: 'ジャンル別' },
    { value: 'version', label: 'バージョン別' },
    { value: 'nameFolder', label: '楽曲名順' },
    { value: 'level', label: 'レベル順' },
  ]

/** ユーザー別の筐体入力値を保存するlocalStorageキーの接頭辞。 */
export const LOCKED_SONG_DISCOVERY_OBSERVATIONS_STORAGE_PREFIX =
  'chunisupport-locked-song-discovery-observations:'

/** 候補曲ダイアログの文言。 */
export const LOCKED_SONG_CANDIDATES_COPY = {
  title: '未解禁候補曲',
  songCountUnit: '曲',
  ultima: 'ULTIMA',
  description: '通常楽曲・ULTIMAの未解禁設定',
  open: '候補曲を確認・未解禁指定',
  close: '閉じる',
  unplayed: '未プレイ',
  opTarget: 'OP対象',
  score: 'スコア',
  op: 'OP',
  percent: 'OP%',
  loadError: '未解禁設定を取得できませんでした。',
  comparisonLoadError: '公式値を取得できませんでした。',
  saveError: '未解禁設定を更新できませんでした。',
  retry: '再読み込み',
  empty: '候補曲はありません',
} as const

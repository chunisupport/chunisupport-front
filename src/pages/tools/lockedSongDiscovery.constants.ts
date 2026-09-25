import type { AppTabOption } from '../../components/common/AppTabs'
import type { LockedSongDiscoveryDifficulty } from '../../utils/lockedSongDiscovery'

/** 筐体表示を照合する分類軸。 */
export type LockedSongDiscoveryAxis = 'genre' | 'version'

/** 未解禁曲ディスカバーの画面文言。タイトルと説明文はツール一覧の定義を参照すること。 */
export const LOCKED_SONG_DISCOVERY_COPY = {
  inputGuide: '筐体と違う分類だけ入力（OP・OP%は片方でも可）',
  dataLoading: '照合用データを読み込み中',
  calculated: 'ChuniSupportの計算値',
  categoryColumn: '分類',
  observedOverPower: '筐体OP',
  observedPercent: '筐体OP%',
  matched: '一致',
  mismatched: '差異あり',
  invalid: '入力エラー',
  empty: '未入力',
  difficultySelect: '難易度',
  axisSelect: '分類軸',
  mismatchedGenres: '差があるジャンル',
  mismatchedVersions: '差があるバージョン',
  candidateTitle: '未解禁曲の候補範囲',
  candidateCountUnit: '件',
  songCountUnit: '曲',
  candidateEmpty: '差がある分類を入力すると、ここに候補が表示されます',
  candidateNotFound: '入力内容に一致する候補範囲はありません',
  openRecords: '候補曲をレコードで表示',
  jumpToCandidates: '候補範囲へ移動',
  recordNavigationError: '候補曲のレコード画面を開けませんでした。',
  recordIncomplete: '照合に必要な未プレイを含む譜面レコードが不足しています。',
} as const

/** 入力対象を切り替える分類軸の選択肢。 */
export const LOCKED_SONG_DISCOVERY_AXIS_OPTIONS: readonly AppTabOption<LockedSongDiscoveryAxis>[] =
  [
    { value: 'genre', label: 'ジャンル別' },
    { value: 'version', label: 'バージョン別' },
  ]

/** 筐体表示を照合する難易度の選択肢。 */
export const LOCKED_SONG_DISCOVERY_DIFFICULTY_OPTIONS: readonly AppTabOption<LockedSongDiscoveryDifficulty>[] =
  [
    { value: 'MASTER', label: 'MASTER' },
    { value: 'ULTIMA', label: 'ULTIMA' },
  ]

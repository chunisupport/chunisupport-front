import type { AppTabOption } from '../../components/common/AppTabs'
import type { LockedSongDiscoveryDifficulty } from '../../utils/lockedSongDiscovery'

/** 筐体表示を照合する分類軸。 */
export type LockedSongDiscoveryAxis = 'genre' | 'version'

/** 未解禁曲ディスカバーの画面文言。タイトルと説明文はツール一覧の定義を参照すること。 */
export const LOCKED_SONG_DISCOVERY_COPY = {
  inputGuide: '差がある分類だけ入力してください。OPとOP%は片方だけでも照合できます。',
  dataLoading: '照合用データを読み込み中',
  calculated: 'ChuniSupport',
  observedOverPower: '筐体OP',
  observedPercent: '筐体OP%',
  matched: '一致',
  mismatched: '差異あり',
  invalid: '入力エラー',
  empty: '入力不要',
  mismatchedGenres: '差があるジャンル',
  mismatchedVersions: '差があるバージョン',
  candidateTitle: '未解禁曲の候補範囲',
  candidateCountUnit: '件',
  candidateEmpty: '差があるジャンルまたはバージョンを入力すると、候補範囲を表示します。',
  candidateNotFound: '入力内容に一致する候補範囲はありません。',
  openRecords: '候補曲をレコードで表示',
  recordNavigationError: '候補曲のレコード画面を開けませんでした。',
  recordIncomplete: '照合に必要な未プレイを含む譜面レコードが不足しています。',
} as const

/** 入力対象を切り替えるタブ。 */
export const LOCKED_SONG_DISCOVERY_AXIS_OPTIONS: readonly AppTabOption<LockedSongDiscoveryAxis>[] =
  [
    { value: 'genre', label: 'ジャンル別' },
    { value: 'version', label: 'バージョン別' },
  ]

/** 筐体表示を照合する難易度タブ。 */
export const LOCKED_SONG_DISCOVERY_DIFFICULTY_OPTIONS: readonly AppTabOption<LockedSongDiscoveryDifficulty>[] =
  [
    { value: 'MASTER', label: 'MASTER' },
    { value: 'ULTIMA', label: 'ULTIMA' },
  ]

import type { AppTabOption } from '../../components/common/AppTabs'
import { localizedCopy } from '../../i18n'
import type { LockedSongDiscoveryDifficulty } from '../../utils/lockedSongDiscovery'

/** 未解禁曲ディスカバーの表示文言 */
const LOCKED_SONG_DISCOVERY_TEXT = localizedCopy('tools.lockedSongDiscovery')

/** 筐体表示を照合する分類軸。 */
export type LockedSongDiscoveryAxis = 'genre' | 'version'

/** 未解禁曲ディスカバーの画面文言。タイトルと説明文はツール一覧の定義を参照すること。 */
export const LOCKED_SONG_DISCOVERY_COPY = localizedCopy(
  'tools.lockedSongDiscovery.lockedSongDiscoveryCopy'
)

/** 入力対象を切り替える分類軸の選択肢。 */
export const LOCKED_SONG_DISCOVERY_AXIS_OPTIONS: readonly AppTabOption<LockedSongDiscoveryAxis>[] =
  [
    { value: 'genre', label: LOCKED_SONG_DISCOVERY_TEXT.genreLabel },
    { value: 'version', label: LOCKED_SONG_DISCOVERY_TEXT.versionLabel },
  ]

/** 筐体表示を照合する難易度の選択肢。 */
export const LOCKED_SONG_DISCOVERY_DIFFICULTY_OPTIONS: readonly AppTabOption<LockedSongDiscoveryDifficulty>[] =
  [
    { value: 'MASTER', label: 'MASTER' },
    { value: 'ULTIMA', label: 'ULTIMA' },
  ]

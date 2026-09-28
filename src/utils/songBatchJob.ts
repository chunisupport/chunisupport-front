import { SONG_BATCH_MAJOR_UPDATE_CONFIRMATION_DELAY_SECONDS } from '../constants/songBatch'
import type { SongBatchMode } from '../types/api'

/**
 * 実行モードを現在のシステム状態で選択できるか判定する。
 * 大型アップデートは譜面定数を不明化するため、メンテナンス中だけ選択できる。
 *
 * @param mode - 判定する楽曲バッチのモード。
 * @param isMaintenance - システムがメンテナンス中かどうか。
 * @returns 選択できる場合は true。
 */
export const isSongBatchModeAvailable = (mode: SongBatchMode, isMaintenance: boolean): boolean =>
  mode !== 'MAJOR_UPDATE' || isMaintenance

/**
 * 確認ダイアログで実行ボタンを有効化するまでの待機秒数を返す。
 *
 * @param mode - 実行する楽曲バッチのモード。
 * @returns 待機秒数。待機不要の場合は 0。
 */
export const getSongBatchConfirmationDelaySeconds = (mode: SongBatchMode): number =>
  mode === 'MAJOR_UPDATE' ? SONG_BATCH_MAJOR_UPDATE_CONFIRMATION_DELAY_SECONDS : 0

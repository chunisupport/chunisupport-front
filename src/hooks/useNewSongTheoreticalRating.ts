import type { Accessor } from 'solid-js'
import { createEffect, createMemo } from 'solid-js'
import { useSongsData } from '../stores/songsData'
import {
  calculateNewSongTheoreticalRating,
  type NewSongTheoreticalRating,
} from '../utils/newSongTheoreticalRating'

/** 新曲枠理論値の遅延取得状態。 */
export type NewSongTheoreticalRatingState = {
  /** 新曲枠理論値の計算結果。 */
  theoreticalRating: Accessor<NewSongTheoreticalRating | undefined>
  /** 楽曲データを取得中か。 */
  isLoading: Accessor<boolean>
  /** 楽曲データの取得エラー。 */
  error: Accessor<unknown>
}

/**
 * 新曲枠の表示時だけ共有楽曲データを取得し、理論値へ変換する。
 *
 * @param enabled - 新曲枠理論値を必要とする表示状態。
 * @param slotCount - 新曲枠の規定枠数。
 * @returns 理論値、読み込み状態、取得エラーのAccessor。
 */
export const useNewSongTheoreticalRating = (
  enabled: Accessor<boolean>,
  slotCount: number
): NewSongTheoreticalRatingState => {
  const { songsResponse, ensureSongsLoaded, isSongsLoading } = useSongsData()

  // 新曲タブを開くまで全楽曲マスタの取得を遅延し、プロフィール初期表示を妨げない。
  createEffect(() => {
    if (enabled()) ensureSongsLoaded()
  })

  const theoreticalRating = createMemo(() => {
    // Resource失敗時は値Accessorを読まず、プロフィール全体への例外伝播を防ぐ。
    if (songsResponse.error) return undefined

    const response = songsResponse()
    return response ? calculateNewSongTheoreticalRating(response.songs, slotCount) : undefined
  })

  return {
    theoreticalRating,
    isLoading: () => enabled() && isSongsLoading(),
    error: () => (enabled() ? songsResponse.error : undefined),
  }
}

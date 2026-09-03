import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createResource, createSignal, onCleanup } from 'solid-js'
import { fetchVersions } from '../api/songs'
import { RATING_SLOT_COUNT } from '../constants/rating'
import { useSongsData } from '../stores/songsData'
import {
  calculateBestTheoreticalRating,
  calculateNewSongTheoreticalRating,
  type RatingTheoretical,
} from '../utils/newSongTheoreticalRating'
import { getTodayChunithmDate } from '../utils/versionConverter'

/** 表示中のJST日付を更新する間隔 */
const CURRENT_DATE_REFRESH_INTERVAL_MS = 60_000

/**
 * CHUNITHMの稼働地域を基準に現在日を返す。
 *
 * @returns YYYY-MM-DD形式のJST現在日。
 */
const getCurrentChunithmDate = (): string => getTodayChunithmDate()

/** ベスト枠・新曲枠理論値の取得状態 */
export type RatingTheoreticalState = {
  /** ベスト枠理論値の計算結果 */
  bestTheoreticalRating: Accessor<RatingTheoretical | undefined>
  /** 新曲枠理論値の計算結果 */
  newTheoreticalRating: Accessor<RatingTheoretical | undefined>
  /** ベスト枠に必要な楽曲・バージョンデータを取得中か */
  isBestLoading: Accessor<boolean>
  /** 新曲枠に必要な楽曲・バージョンデータを取得中か */
  isNewLoading: Accessor<boolean>
  /** ベスト枠に必要な楽曲・バージョンデータの取得エラー */
  bestError: Accessor<unknown>
  /** 新曲枠に必要な楽曲・バージョンデータの取得エラー */
  newError: Accessor<unknown>
}

/**
 * 共有楽曲データとバージョン一覧を取得し、ベスト枠・新曲枠の理論値へ変換する。
 *
 * @returns 両レーティング枠の理論値と枠別の読み込み・エラー状態。
 */
export const useRatingTheoretical = (): RatingTheoreticalState => {
  const { songsResponse, ensureSongsLoaded, isSongsLoading } = useSongsData()
  const [referenceDate, setReferenceDate] = createSignal(getCurrentChunithmDate())
  const [versionsResponse] = createResource(fetchVersions)

  // ツールページのマウント時に共有楽曲マスタを取得する。
  createEffect(ensureSongsLoaded)

  // 表示中の日付またぎを対象譜面へ反映する。
  createEffect(() => {
    setReferenceDate(getCurrentChunithmDate())
    const intervalId = window.setInterval(
      () => setReferenceDate(getCurrentChunithmDate()),
      CURRENT_DATE_REFRESH_INTERVAL_MS
    )
    onCleanup(() => window.clearInterval(intervalId))
  })

  const bestTheoreticalRating = createMemo(() => {
    if (songsResponse.error || versionsResponse.error) return undefined

    const songs = songsResponse()?.songs
    const versions = versionsResponse()?.versions
    return songs && versions
      ? calculateBestTheoreticalRating(songs, versions, referenceDate(), RATING_SLOT_COUNT.best)
      : undefined
  })

  const newTheoreticalRating = createMemo(() => {
    // Resource失敗時は値Accessorを読まず、ツールページへの例外伝播を防ぐ。
    if (songsResponse.error || versionsResponse.error) return undefined

    const songs = songsResponse()?.songs
    const versions = versionsResponse()?.versions
    return songs && versions
      ? calculateNewSongTheoreticalRating(songs, versions, referenceDate(), RATING_SLOT_COUNT.new)
      : undefined
  })

  return {
    bestTheoreticalRating,
    newTheoreticalRating,
    isBestLoading: () => isSongsLoading() || versionsResponse.loading,
    isNewLoading: () => isSongsLoading() || versionsResponse.loading,
    bestError: () => songsResponse.error ?? versionsResponse.error,
    newError: () => songsResponse.error ?? versionsResponse.error,
  }
}

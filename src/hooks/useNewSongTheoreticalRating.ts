import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createResource, createSignal, onCleanup } from 'solid-js'
import { fetchVersions } from '../api/songs'
import { useSongsData } from '../stores/songsData'
import {
  calculateNewSongTheoreticalRating,
  type NewSongTheoreticalRating,
} from '../utils/newSongTheoreticalRating'

/** CHUNITHMの現行日付判定に使うIANAタイムゾーン。 */
const CHUNITHM_TIME_ZONE = 'Asia/Tokyo'
/** YYYY-MM-DD形式で日付を得るためのロケール。 */
const DATE_ONLY_LOCALE = 'sv-SE'
/** CHUNITHM稼働地域の現在日を生成するフォーマッター。 */
const CHUNITHM_DATE_FORMATTER = new Intl.DateTimeFormat(DATE_ONLY_LOCALE, {
  timeZone: CHUNITHM_TIME_ZONE,
})
/** 表示中のJST日付を更新する間隔。 */
const CURRENT_DATE_REFRESH_INTERVAL_MS = 60_000

/**
 * CHUNITHMの稼働地域を基準に現在日を返す。
 *
 * @returns YYYY-MM-DD形式のJST現在日。
 */
const getCurrentChunithmDate = (): string => CHUNITHM_DATE_FORMATTER.format(new Date())

/** 新曲枠理論値の遅延取得状態。 */
export type NewSongTheoreticalRatingState = {
  /** 新曲枠理論値の計算結果。 */
  theoreticalRating: Accessor<NewSongTheoreticalRating | undefined>
  /** 楽曲・バージョンデータを取得中か。 */
  isLoading: Accessor<boolean>
  /** 楽曲・バージョンデータの取得エラー。 */
  error: Accessor<unknown>
}

/**
 * 必要な表示で共有楽曲データとバージョン一覧を取得し、新曲枠の上限値へ変換する。
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
  const [referenceDate, setReferenceDate] = createSignal(getCurrentChunithmDate())
  const [versionsResponse] = createResource(() => (enabled() ? true : undefined), fetchVersions)

  // 呼び出し側が表示を必要とするまで全楽曲マスタの取得を遅延する。
  createEffect(() => {
    if (enabled()) ensureSongsLoaded()
  })

  // 表示を開くたびに基準日を更新し、表示中の日付またぎも対象譜面へ反映する。
  createEffect(() => {
    if (!enabled()) return

    setReferenceDate(getCurrentChunithmDate())
    const intervalId = window.setInterval(
      () => setReferenceDate(getCurrentChunithmDate()),
      CURRENT_DATE_REFRESH_INTERVAL_MS
    )
    onCleanup(() => window.clearInterval(intervalId))
  })

  const theoreticalRating = createMemo(() => {
    // Resource失敗時は値Accessorを読まず、プロフィール全体への例外伝播を防ぐ。
    if (songsResponse.error || versionsResponse.error) return undefined

    const songs = songsResponse()?.songs
    const versions = versionsResponse()?.versions
    return songs && versions
      ? calculateNewSongTheoreticalRating(songs, versions, referenceDate(), slotCount)
      : undefined
  })

  return {
    theoreticalRating,
    isLoading: () => enabled() && (isSongsLoading() || versionsResponse.loading),
    error: () => (enabled() ? (songsResponse.error ?? versionsResponse.error) : undefined),
  }
}

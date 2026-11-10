import { CHUNITHM_DAY_START_HOUR, JST_TIME_ZONE, JST_UTC_OFFSET } from '../constants/dateTime'

/** YYYY-MM-DD形式で日付を得るためのロケール */
const DATE_ONLY_LOCALE = 'sv-SE'

/** 実行環境のタイムゾーンに依存せず、JSTの暦日を得るフォーマッター */
const CHUNITHM_DATE_FORMATTER = new Intl.DateTimeFormat(DATE_ONLY_LOCALE, {
  timeZone: JST_TIME_ZONE,
})

/** 運用日を暦日へずらす幅。JST 07:00未満を前日にするため */
const CHUNITHM_DAY_START_MS = CHUNITHM_DAY_START_HOUR * 60 * 60 * 1000

/**
 * 時刻をCHUNITHMの運用日へ変換する。
 *
 * 運用日はJST 07:00に切り替わる。07:00未満は前日になる。
 * `Asia/Tokyo` で暦日を得るため、ブラウザのローカルタイムゾーンには依存しない。
 *
 * @param instant - 判定する時刻。
 * @returns YYYY-MM-DD形式の運用日。
 */
export function toChunithmDate(instant: Date): string {
  return CHUNITHM_DATE_FORMATTER.format(instant.getTime() - CHUNITHM_DAY_START_MS)
}

/**
 * 現在のCHUNITHM運用日を返す。
 *
 * 現行バージョンの公開判定と、新曲枠・ベスト枠の基準日に使う。
 *
 * @param now - 判定する時刻。省略時は現在時刻。
 * @returns YYYY-MM-DD形式の運用日。JST 07:00未満は前日。
 */
export function getTodayChunithmDate(now: Date = new Date()): string {
  return toChunithmDate(now)
}

/**
 * 稼働日のJST 07:00をエポックミリ秒にする。
 *
 * 新バージョンはこの時刻から現行になる。日付文字列の先頭10文字を暦日として使い、
 * 時刻が付いていても見ない。
 *
 * @param releasedAt - バージョンの稼働日。先頭がYYYY-MM-DD。
 * @returns 稼働開始時刻のミリ秒。日付として解釈できない場合はNaN。
 */
export function toChunithmDayStartTimestamp(releasedAt: string): number {
  const date = releasedAt.slice(0, 10)
  const hour = String(CHUNITHM_DAY_START_HOUR).padStart(2, '0')
  return new Date(`${date}T${hour}:00:00${JST_UTC_OFFSET}`).getTime()
}

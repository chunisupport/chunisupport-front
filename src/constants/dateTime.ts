/** 日時表示に使うタイムゾーン。CHUNITHM の運用に合わせて日本時間へ固定する */
export const JST_TIME_ZONE = 'Asia/Tokyo'

/**
 * CHUNITHMの日付が切り替わる時刻（JSTの時）。
 * この時刻から新しい運用日になり、その稼働日のバージョンが現行になる。
 */
export const CHUNITHM_DAY_START_HOUR = 7

/**
 * JSTのUTCオフセット。日本は通年 UTC+9 で、夏時間はない。
 * 日付文字列から稼働開始時刻を作るときに使う。
 */
export const JST_UTC_OFFSET = '+09:00'

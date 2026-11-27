import type {
  AppAnnouncementDTO,
  AppAnnouncementKind,
  AppAnnouncementRequestDTO,
} from '../../types/api'
import { resolveAppAnnouncementTarget } from '../../utils/appAnnouncement'
import { formatJstDateTimeLocalInput, parseJstDateTimeLocalInput } from '../../utils/jstDateTime'

/** お知らせ編集フォームの入力値。日時はJSTの `datetime-local` 値 */
export type AppAnnouncementFormValue = {
  kind: AppAnnouncementKind
  title: string
  body: string
  targetUrl: string
  startsAt: string
  expiresAt: string
}

/** 項目に紐づく入力エラー。値は対象項目の近くに出す */
export type AppAnnouncementFormErrors = {
  /** 遷移させられないURLの場合は true */
  targetUrl: boolean
  /** 終了が開始以前の場合は true */
  expiresAt: boolean
}

/** 配信状態 */
export type AppAnnouncementStatus = 'scheduled' | 'active' | 'ended'

/**
 * 編集対象からフォームの初期値を作る。
 *
 * @param announcement - 編集対象。新規追加の場合はnull。
 * @returns フォームの初期値。未知の種別は本文型として扱う。
 */
export const buildAppAnnouncementFormValue = (
  announcement: AppAnnouncementDTO | null
): AppAnnouncementFormValue => ({
  kind: announcement?.kind === 'link' ? 'link' : 'message',
  title: announcement?.title ?? '',
  body: announcement?.body ?? '',
  targetUrl: announcement?.target_url ?? '',
  startsAt: announcement ? formatJstDateTimeLocalInput(announcement.starts_at) : '',
  expiresAt: announcement ? formatJstDateTimeLocalInput(announcement.expires_at) : '',
})

/**
 * 入力済みの値のうち、項目の近くに示すべき誤りを判定する。未入力は誤りとして扱わない。
 *
 * @param form - フォームの入力値。
 * @returns 項目ごとの入力エラー。
 */
export const getAppAnnouncementFormErrors = (
  form: AppAnnouncementFormValue
): AppAnnouncementFormErrors => {
  const targetUrl = form.targetUrl.trim()
  const startsAt = parseJstDateTimeLocalInput(form.startsAt)
  const expiresAt = parseJstDateTimeLocalInput(form.expiresAt)
  return {
    targetUrl:
      form.kind === 'link' && targetUrl !== '' && resolveAppAnnouncementTarget(targetUrl) === null,
    expiresAt:
      startsAt !== null && expiresAt !== null && Date.parse(startsAt) >= Date.parse(expiresAt),
  }
}

/**
 * フォームの入力値をAPIのリクエストへ変換する。種別で使わない項目は null にする。
 *
 * @param form - フォームの入力値。
 * @returns リクエスト。必須項目の欠落、不正なURL、期間の逆転がある場合はnull。
 */
export const buildAppAnnouncementRequest = (
  form: AppAnnouncementFormValue
): AppAnnouncementRequestDTO | null => {
  const title = form.title.trim()
  const body = form.body.trim()
  const targetUrl = form.targetUrl.trim()
  const startsAt = parseJstDateTimeLocalInput(form.startsAt)
  const expiresAt = parseJstDateTimeLocalInput(form.expiresAt)
  const errors = getAppAnnouncementFormErrors(form)
  if (!title || !startsAt || !expiresAt || errors.targetUrl || errors.expiresAt) return null
  if (form.kind === 'message') {
    return body
      ? {
          kind: 'message',
          title,
          body,
          target_url: null,
          starts_at: startsAt,
          expires_at: expiresAt,
        }
      : null
  }
  return targetUrl
    ? {
        kind: 'link',
        title,
        body: null,
        target_url: targetUrl,
        starts_at: startsAt,
        expires_at: expiresAt,
      }
    : null
}

/**
 * 現在時刻に対する配信状態を返す。
 *
 * @param announcement - 対象のお知らせ。
 * @param now - 現在時刻。
 * @returns 開始前、配信中、終了済みのいずれか。
 */
export const getAppAnnouncementStatus = (
  announcement: AppAnnouncementDTO,
  now: Date
): AppAnnouncementStatus => {
  if (now.getTime() < Date.parse(announcement.starts_at)) return 'scheduled'
  return now.getTime() < Date.parse(announcement.expires_at) ? 'active' : 'ended'
}

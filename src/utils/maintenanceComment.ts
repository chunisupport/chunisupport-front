import {
  type MAINTENANCE_COMMENT_ERROR_MESSAGES,
  MAINTENANCE_COMMENT_MAX_CODE_POINTS,
} from '../constants/maintenance'

const CONTROL_CHARACTER_PATTERN = /\p{Cc}/u
const EDGE_WHITESPACE_PATTERN =
  /^(?:\n|[\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000])+|(?:\n|[\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000])+$/gu

/** メンテナンスコメントの検証エラー種別。 */
export type MaintenanceCommentValidationError = keyof typeof MAINTENANCE_COMMENT_ERROR_MESSAGES

/** メンテナンスコメント検証時の指定。 */
export interface MaintenanceCommentValidationOptions {
  /** 空白除去後の空文字をエラーにする場合は true。 */
  required?: boolean
}

/** 正規化済みメンテナンスコメントと検証結果。 */
export interface MaintenanceCommentValidationResult {
  /** APIへ送信できるように正規化したコメント。 */
  value: string
  /** 検証に成功した場合は null、失敗した場合はエラー種別。 */
  error: MaintenanceCommentValidationError | null
}

/**
 * メンテナンスコメントの改行と前後空白をAPIと同じ規則で正規化する。
 *
 * CRLFとCRをLFへ統一し、Unicode空白を前後から取り除く。
 * 改行以外の制御文字は検証時に拒否できるよう保持する。
 *
 * @param value - 正規化するコメント。
 * @returns 改行と前後空白を正規化したコメント。
 */
export const normalizeMaintenanceComment = (value: string): string =>
  value.replace(/\r\n?/g, '\n').replace(EDGE_WHITESPACE_PATTERN, '')

/**
 * 文字列に含まれるUnicodeコードポイント数を数える。
 *
 * @param value - 数える文字列。
 * @returns Unicodeコードポイント数。
 */
export const countMaintenanceCommentCodePoints = (value: string): number => Array.from(value).length

/**
 * メンテナンスコメントをAPIと同じ規則で正規化・検証する。
 *
 * @param value - 入力されたコメント。
 * @param options - 空コメントを拒否するかの指定。
 * @returns 正規化済みコメントと、存在する場合は検証エラー。
 */
export const validateMaintenanceComment = (
  value: string,
  options: MaintenanceCommentValidationOptions = {}
): MaintenanceCommentValidationResult => {
  const normalizedLineEndings = value.replace(/\r\n?/g, '\n')
  const normalizedValue = normalizeMaintenanceComment(value)

  for (const character of normalizedLineEndings) {
    if (character !== '\n' && CONTROL_CHARACTER_PATTERN.test(character)) {
      return {
        value: normalizedValue,
        error: 'control_character',
      }
    }
  }

  if (countMaintenanceCommentCodePoints(normalizedValue) > MAINTENANCE_COMMENT_MAX_CODE_POINTS) {
    return {
      value: normalizedValue,
      error: 'too_long',
    }
  }

  if (options.required && normalizedValue === '') {
    return {
      value: normalizedValue,
      error: 'required',
    }
  }

  return {
    value: normalizedValue,
    error: null,
  }
}

import {
  DIFFICULTY_BADGE_CLASS_MAP,
  DIFFICULTY_CARD_BORDER_CLASS_MAP,
  DIFFICULTY_SINGLE_LETTER_MAP,
  normalizePlayerDataDifficulty,
} from '../constants/difficulty'
import type { PlayerDataDifficulty } from '../types/api'

/**
 * 難易度の略称を返す。
 * @param difficulty 難易度
 * @returns 難易度の略称
 */
export function difficultyShort(difficulty: string): string {
  const normalized = normalizePlayerDataDifficulty(difficulty)
  return normalized ? DIFFICULTY_SINGLE_LETTER_MAP[normalized] : ''
}

/**
 * 難易度をURLクエリ用の小文字値へ変換する。
 * @param difficulty 難易度
 * @returns URLクエリへ設定する値
 */
export function difficultyToQueryValue(difficulty: string): string {
  switch (difficulty) {
    case 'BASIC':
      return 'basic'
    case 'ADVANCED':
      return 'advanced'
    case 'EXPERT':
      return 'expert'
    case 'MASTER':
      return 'master'
    case 'ULTIMA':
      return 'ultima'
    default:
      return difficulty.trim().toLowerCase()
  }
}

/**
 * URLクエリから取得した難易度値を比較用の大文字値へ正規化する。
 * @param difficulty URLクエリから取得した難易度値
 * @returns 正規化済みの難易度値
 */
export function normalizeDifficultyQueryValue(
  difficulty: string | string[] | null | undefined
): PlayerDataDifficulty | '' {
  const value = Array.isArray(difficulty) ? difficulty[0] : difficulty
  return value ? (normalizePlayerDataDifficulty(value) ?? '') : ''
}

/**
 * 難易度バッジ用のTailwindクラスを返す。
 * @param difficulty 難易度
 * @returns 背景色と文字色のトークンクラス
 */
export function difficultyBadgeClass(difficulty: string): string {
  const normalized = normalizePlayerDataDifficulty(difficulty)
  return normalized ? DIFFICULTY_BADGE_CLASS_MAP[normalized] : 'bg-action-secondary text-text'
}

/**
 * UserRecordCardの左端に表示する難易度色クラスを返す。
 * @param difficulty 難易度
 * @returns 疑似要素の背景色クラス
 */
export function difficultyCardBorderColor(difficulty: string): string {
  const normalized = normalizePlayerDataDifficulty(difficulty)
  return normalized ? DIFFICULTY_CARD_BORDER_CLASS_MAP[normalized] : 'before:bg-border-strong'
}

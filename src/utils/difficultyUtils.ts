// 難易度の略称を返す
/**
 * 難易度の略称を返す。
 * @param difficulty 難易度
 * @returns 難易度の略称
 */
export function difficultyShort(difficulty: string): string {
  switch (difficulty) {
    case 'BASIC':
      return 'B'
    case 'ADVANCED':
      return 'A'
    case 'EXPERT':
      return 'E'
    case 'MASTER':
      return 'M'
    case 'ULTIMA':
      return 'U'
    default:
      return ''
  }
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
 * URLクエリから取得した難易度値を比較用の小文字値へ正規化する。
 * @param difficulty URLクエリから取得した難易度値
 * @returns 正規化済みの難易度値
 */
export function normalizeDifficultyQueryValue(
  difficulty: string | string[] | null | undefined
): string {
  const value = Array.isArray(difficulty) ? difficulty[0] : difficulty
  return value?.trim().toLowerCase() ?? ''
}

// 難易度ごとの正規ゲームカラー（16進数）
/** 難易度ごとの正規ゲームカラー。 */
export const DIFFICULTY_HEX_COLORS: Record<string, string> = {
  BASIC: '#00ab84',
  ADVANCED: '#ff7e00',
  EXPERT: '#f12929',
  MASTER: '#8e1be5',
  ULTIMA: '#000000',
}

// 難易度バッジ用のTailwindクラスを返す（ゲーム公式カラー）
/**
 * 難易度バッジ用のTailwindクラスを返す。
 * @param difficulty 難易度
 * @returns 背景色と文字色のトークンクラス
 */
export function difficultyBadgeClass(difficulty: string): string {
  switch (difficulty) {
    case 'BASIC':
      return 'bg-difficulty-basic-bg text-difficulty-basic-text'
    case 'ADVANCED':
      return 'bg-difficulty-advanced-bg text-difficulty-advanced-text'
    case 'EXPERT':
      return 'bg-difficulty-expert-bg text-difficulty-expert-text'
    case 'MASTER':
      return 'bg-difficulty-master-bg text-difficulty-master-text'
    case 'ULTIMA':
      return 'bg-difficulty-ultima-bg text-difficulty-ultima-text'
    default:
      return 'bg-action-secondary text-text'
  }
}

// 難易度のTailwindクラスを返す
/**
 * 難易度の補助表示用Tailwindクラスを返す。
 * @param difficulty 難易度
 * @returns 補助表示用の背景色と文字色のトークンクラス
 */
export function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'BASIC':
      return 'bg-difficulty-basic-bg text-difficulty-basic-text'
    case 'ADVANCED':
      return 'bg-difficulty-advanced-bg text-difficulty-advanced-text'
    case 'EXPERT':
      return 'bg-difficulty-expert-bg text-difficulty-expert-text'
    case 'MASTER':
      return 'bg-difficulty-master-bg text-difficulty-master-text'
    case 'ULTIMA':
      return 'bg-difficulty-ultima-bg text-difficulty-ultima-text'
    default:
      return ''
  }
}

// 難易度のCSS色値を返す（インラインスタイル用）
/**
 * 難易度のCSS色値を返す。
 * @param difficulty 難易度
 * @returns 難易度に対応する色値
 */
export function difficultyBorderColor(difficulty: string): string {
  return DIFFICULTY_HEX_COLORS[difficulty] ?? 'transparent'
}

// 難易度の色クラスを返す（UserRecordCard用）
/**
 * UserRecordCardの左端に表示する難易度色クラスを返す。
 * @param difficulty 難易度
 * @returns 疑似要素の背景色クラス
 */
export function difficultyCardBorderColor(difficulty: string): string {
  switch (difficulty) {
    case 'BASIC':
      return 'before:bg-difficulty-basic-bg'
    case 'ADVANCED':
      return 'before:bg-difficulty-advanced-bg'
    case 'EXPERT':
      return 'before:bg-difficulty-expert-bg'
    case 'MASTER':
      return 'before:bg-difficulty-master-bg'
    case 'ULTIMA':
      return 'before:[background:repeating-linear-gradient(-60deg,#ff0000_0,#ff0000_6px,#000000_6px,#000000_12px)]'
    default:
      return 'before:bg-border-strong'
  }
}

export const DIFFICULTY_SHORT_NAME_MAP = {
  BASIC: 'BAS',
  ADVANCED: 'ADV',
  EXPERT: 'EXP',
  MASTER: 'MAS',
  ULTIMA: 'ULT',
} as const

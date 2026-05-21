// 難易度の略称を返す
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

export function normalizeDifficultyQueryValue(
  difficulty: string | string[] | null | undefined
): string {
  const value = Array.isArray(difficulty) ? difficulty[0] : difficulty
  return value?.trim().toLowerCase() ?? ''
}

// 難易度ごとの正規ゲームカラー（16進数）
export const DIFFICULTY_HEX_COLORS: Record<string, string> = {
  BASIC: '#00ab84',
  ADVANCED: '#ff7e00',
  EXPERT: '#f12929',
  MASTER: '#8e1be5',
  ULTIMA: '#000000',
}

// 難易度バッジ用のTailwindクラスを返す（ゲーム公式カラー）
export function difficultyBadgeClass(difficulty: string): string {
  switch (difficulty) {
    case 'BASIC':
      return 'bg-[#00ab84] text-white'
    case 'ADVANCED':
      return 'bg-[#ff7e00] text-white'
    case 'EXPERT':
      return 'bg-[#f12929] text-white'
    case 'MASTER':
      return 'bg-[#8e1be5] text-white'
    case 'ULTIMA':
      return 'bg-[#000000] text-white'
    default:
      return 'bg-gray-200 text-gray-800'
  }
}

// 難易度のTailwindクラスを返す
export function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'BASIC':
      return 'bg-green-100 text-white'
    case 'ADVANCED':
      return 'bg-yellow-100 text-white'
    case 'EXPERT':
      return 'bg-pink-100 text-white'
    case 'MASTER':
      return 'bg-purple-100 text-white'
    case 'ULTIMA':
      return 'bg-red-100 text-white'
    default:
      return ''
  }
}

// 難易度のCSS色値を返す（インラインスタイル用）
export function difficultyBorderColor(difficulty: string): string {
  return DIFFICULTY_HEX_COLORS[difficulty] ?? 'transparent'
}

// 難易度の色クラスを返す（UserRecordCard用）
export function difficultyCardBorderColor(difficulty: string): string {
  switch (difficulty) {
    case 'BASIC':
      return 'before:bg-[#00ab84]'
    case 'ADVANCED':
      return 'before:bg-[#ff7e00]'
    case 'EXPERT':
      return 'before:bg-[#f12929]'
    case 'MASTER':
      return 'before:bg-[#8e1be5]'
    case 'ULTIMA':
      return 'before:[background:repeating-linear-gradient(-60deg,#ff0000_0,#ff0000_6px,#000000_6px,#000000_12px)]'
    default:
      return 'before:bg-gray-500'
  }
}

export const DIFFICULTY_SHORT_NAME_MAP = {
  BASIC: 'BAS',
  ADVANCED: 'ADV',
  EXPERT: 'EXP',
  MASTER: 'MAS',
  ULTIMA: 'ULT',
} as const

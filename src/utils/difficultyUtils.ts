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

// 難易度の色クラスを返す（RecordTable用）
export function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'BASIC':
      return 'bg-green-100 text-green-800'
    case 'ADVANCED':
      return 'bg-yellow-100 text-yellow-800'
    case 'EXPERT':
      return 'bg-pink-100 text-pink-800'
    case 'MASTER':
      return 'bg-purple-100 text-purple-800'
    case 'ULTIMA':
      return 'bg-red-100 text-red-800'
    default:
      return ''
  }
}

// 難易度の色クラスを返す（UserRecordCard用）
export function difficultyCardBorderColor(difficulty: string): string {
  switch (difficulty) {
    case 'BASIC':
      return 'before:bg-green-500'
    case 'ADVANCED':
      return 'before:bg-orange-500'
    case 'EXPERT':
      return 'before:bg-red-500'
    case 'MASTER':
      return 'before:bg-purple-500'
    case 'ULTIMA':
      return 'before:[background:repeating-linear-gradient(-60deg,#ff0000_0,#ff0000_6px,#000000_6px,#000000_12px)]'
    default:
      return 'before:bg-gray-500'
  }
}

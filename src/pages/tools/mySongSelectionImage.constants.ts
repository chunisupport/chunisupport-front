import type { PlayerDataDifficulty } from '../../types/api'

export const MY_SONG_SELECTION_IMAGE_COPY = {
  title: '自選曲カードメーカー',
  description: '曲と難易度から、16:9の自選曲画像を生成します。',
  headingLabel: '見出し',
  songSearchLabel: '曲名',
  difficultyLabel: '難易度',
  selectedSongLabel: '選択中',
  generateButtonLabel: '生成',
  downloadButtonLabel: 'PNG保存',
  noSongSelectedMessage: '曲を選択してください。',
  noChartMessage: '選択した難易度の譜面がありません。',
  generationErrorMessage: '画像生成に失敗しました。もう一度お試しください。',
  emptyResultMessage: '該当する曲がありません。',
  placeholderHeading: '〇〇の自選曲',
  searchPlaceholder: '曲名・アーティストで検索',
  constUnknownLabel: '不明',
  jacketAlt: '生成された自選曲画像',
} as const

export const MY_SONG_SELECTION_IMAGE_DEFAULTS = {
  heading: '〇〇の自選曲',
  difficulty: 'MASTER' as PlayerDataDifficulty,
} as const

export const MY_SONG_SELECTION_IMAGE_DIFFICULTIES: readonly PlayerDataDifficulty[] = [
  'BASIC',
  'ADVANCED',
  'EXPERT',
  'MASTER',
  'ULTIMA',
]

export const MY_SONG_SELECTION_IMAGE_CANVAS = {
  width: 1920,
  height: 1080,
  jacketSize: 690,
  jacketX: 165,
  jacketY: 255,
  infoX: 990,
  headingY: 145,
} as const

/** 楽曲詳細で難易度ラベル幅を揃える通常表示用クラス。 */
export const DIFFICULTY_BADGE_FIXED_WIDTH_CLASS = 'w-[5.75rem]'

/** 分析表など狭い領域で使う省スペース表示用クラス。 */
export const DIFFICULTY_BADGE_COMPACT_WIDTH_CLASS = 'min-w-fit'

/**
 * 難易度バッジの表示密度に応じた幅クラスを返す。
 *
 * @param compact - 表内向けの省スペース表示にするか。
 * @returns 通常表示では固定幅、省スペース表示では内容幅のTailwindクラス。
 */
export const getDifficultyBadgeWidthClass = (compact: boolean | undefined): string =>
  compact === true ? DIFFICULTY_BADGE_COMPACT_WIDTH_CLASS : DIFFICULTY_BADGE_FIXED_WIDTH_CLASS

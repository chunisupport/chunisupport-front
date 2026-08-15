/** コースクラスのAPI値と表示値の対応表。 */
const COURSE_CLASS_LABELS: Readonly<Record<string, string>> = {
  '1': 'Ⅰ',
  '2': 'Ⅱ',
  '3': 'Ⅲ',
  '4': 'Ⅳ',
  '5': 'Ⅴ',
  inf: '∞',
  extra: 'EX',
}

/** コースクラス別の背景色Tailwindクラスの対応表。 */
const COURSE_CLASS_BG_CLASS: Readonly<Record<string, string>> = {
  '1': 'bg-course-class-1-bg',
  '2': 'bg-course-class-2-bg',
  '3': 'bg-course-class-3-bg',
  '4': 'bg-course-class-4-bg',
  '5': 'bg-course-class-5-bg',
}

/** EXクラス用のWORLD'S ENDと共通の虹グラデーション背景クラス。 */
const COURSE_CLASS_EXTRA_BG_CLASS = 'bg-[image:var(--cs-color-worldsend-label-bg)]'

/** ∞クラス用のAJCと同じ薄い虹グラデーション背景クラス。 */
const COURSE_CLASS_INF_BG_CLASS = 'bg-[image:var(--cs-color-course-class-inf-bg)]'

/**
 * コースクラスのAPI値を短縮表記へ変換する。
 *
 * @param courseClass - APIから返却されたコースクラス。
 * @returns 表示用のコースクラス。未対応値は元の値を返す。
 */
export const formatCourseClass = (courseClass: string): string =>
  COURSE_CLASS_LABELS[courseClass.toLowerCase()] ?? courseClass

/**
 * コースクラスに応じたバッジ用Tailwindクラスを返す。
 *
 * @param courseClass - APIから返却されたコースクラス。
 * @returns 背景色と文字色のトークンクラス。未対応値はsuccess色を返す。
 */
export const courseClassBadgeClass = (courseClass: string): string => {
  const normalized = courseClass.toLowerCase()
  if (normalized === 'extra') {
    return `${COURSE_CLASS_EXTRA_BG_CLASS} text-course-class-text text-shadow-badge`
  }
  if (normalized === 'inf') {
    return `${COURSE_CLASS_INF_BG_CLASS} text-course-class-text text-shadow-badge`
  }
  const bgClass = COURSE_CLASS_BG_CLASS[normalized]
  return bgClass
    ? `${bgClass} text-course-class-text text-shadow-badge`
    : 'bg-success-bg text-success text-shadow-badge'
}

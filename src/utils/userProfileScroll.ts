/**
 * ユーザープロフィール画面の先頭へスクロールする。
 *
 * @param behavior - スクロール時の動作。
 * @returns なし。
 */
export const scrollToUserProfileContent = (behavior: ScrollBehavior = 'auto'): void => {
  const scrollTarget = document.getElementById('app-main')
  if (!scrollTarget || scrollTarget.scrollTop <= 0) return

  scrollTarget.scrollTo({
    top: 0,
    behavior,
  })
}

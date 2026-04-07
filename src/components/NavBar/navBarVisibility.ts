type NavBarVisibilityParams = {
  previousScrollTop: number
  currentScrollTop: number
  isVisible: boolean
  minimumDelta?: number
}

const DEFAULT_MINIMUM_DELTA = 6
const TOP_VISIBLE_THRESHOLD = 16

export const resolveNavBarVisibility = ({
  previousScrollTop,
  currentScrollTop,
  isVisible,
  minimumDelta = DEFAULT_MINIMUM_DELTA,
}: NavBarVisibilityParams): boolean => {
  if (currentScrollTop <= TOP_VISIBLE_THRESHOLD) {
    return true
  }

  const delta = currentScrollTop - previousScrollTop
  if (Math.abs(delta) < minimumDelta) {
    return isVisible
  }

  return delta < 0
}

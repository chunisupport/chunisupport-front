export const PROFILE_SWIPE_THRESHOLD_PX = 48

export const profileSwipeTabs = ['best', 'new', 'standard', 'worldsend'] as const

export type ProfileSwipeTab = (typeof profileSwipeTabs)[number]

export const resolveProfileSwipeTab = (
  pageTab: 'rating' | 'records',
  ratingTab: 'best' | 'new',
  recordTab: 'standard' | 'worldsend'
): ProfileSwipeTab => {
  if (pageTab === 'rating') {
    return ratingTab
  }

  return recordTab
}

export const applyProfileSwipeTab = (
  tab: ProfileSwipeTab
): {
  pageTab: 'rating' | 'records'
  ratingTab: 'best' | 'new'
  recordTab: 'standard' | 'worldsend'
} => {
  switch (tab) {
    case 'best':
      return { pageTab: 'rating', ratingTab: 'best', recordTab: 'standard' }
    case 'new':
      return { pageTab: 'rating', ratingTab: 'new', recordTab: 'standard' }
    case 'standard':
      return { pageTab: 'records', ratingTab: 'new', recordTab: 'standard' }
    case 'worldsend':
      return { pageTab: 'records', ratingTab: 'new', recordTab: 'worldsend' }
  }
}

export const getSwipedProfileTab = (
  currentTab: ProfileSwipeTab,
  deltaX: number,
  thresholdPx = PROFILE_SWIPE_THRESHOLD_PX
): ProfileSwipeTab => {
  if (Math.abs(deltaX) < thresholdPx) {
    return currentTab
  }

  const currentIndex = profileSwipeTabs.indexOf(currentTab)
  if (currentIndex < 0) {
    return currentTab
  }

  if (deltaX < 0) {
    return profileSwipeTabs[Math.min(currentIndex + 1, profileSwipeTabs.length - 1)]
  }

  return profileSwipeTabs[Math.max(currentIndex - 1, 0)]
}

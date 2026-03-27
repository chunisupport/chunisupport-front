export const userProfileTabs = ['rating_best', 'rating_new', 'record', 'record_we'] as const

export type UserProfileTab = (typeof userProfileTabs)[number]

export const DEFAULT_USER_PROFILE_TAB: UserProfileTab = 'rating_best'

export const normalizeUserProfileTab = (value: string | undefined): UserProfileTab => {
  if (value && userProfileTabs.includes(value as UserProfileTab)) {
    return value as UserProfileTab
  }

  return DEFAULT_USER_PROFILE_TAB
}

export const resolvePageTab = (tab: UserProfileTab): 'rating' | 'records' => {
  return tab === 'record' || tab === 'record_we' ? 'records' : 'rating'
}

export const resolveRatingTab = (tab: UserProfileTab): 'best' | 'new' => {
  return tab === 'rating_new' ? 'new' : 'best'
}

export const resolveRecordTab = (tab: UserProfileTab): 'standard' | 'worldsend' => {
  return tab === 'record_we' ? 'worldsend' : 'standard'
}

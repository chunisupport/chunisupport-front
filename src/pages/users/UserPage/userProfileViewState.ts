export type UserProfilePageTabValue = 'rating' | 'records'

const isRecordView = (view: string | undefined): view is 'record' => view === 'record'

export const getUserProfilePageTabValue = (view: string | undefined): UserProfilePageTabValue => {
  return isRecordView(view) ? 'records' : 'rating'
}

export const shouldFetchRecordProfile = (view: string | undefined): boolean => {
  return isRecordView(view)
}

export const getUserProfileSearchParamsForTab = (
  tabValue: UserProfilePageTabValue
): { view?: 'record' | undefined } => {
  return tabValue === 'records' ? { view: 'record' } : { view: undefined }
}

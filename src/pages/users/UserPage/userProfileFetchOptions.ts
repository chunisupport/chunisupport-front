type UserProfileFetchView = 'rating' | 'record'

export const getUserProfileFetchOptions = (view?: UserProfileFetchView) => ({
  includeNoPlay: true,
  ...(view ? { view } : {}),
})

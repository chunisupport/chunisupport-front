const AuthLoadingIndicator = () => {
  return (
    <div class="flex min-h-[6rem] items-center justify-center" aria-live="polite" aria-busy="true">
      <div
        class="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600"
        aria-hidden="true"
      />
      <span class="sr-only">読み込み中</span>
    </div>
  )
}

export default AuthLoadingIndicator

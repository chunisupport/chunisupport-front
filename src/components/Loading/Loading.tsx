const Loading = () => {
  return (
    <output
      class="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
      aria-live="polite"
    >
      <div class="h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-gray-500"></div>
      <span class="sr-only">読み込み中</span>
    </output>
  )
}

export default Loading

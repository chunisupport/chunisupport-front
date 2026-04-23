import { A, useLocation } from '@solidjs/router'

const SongsViewToggle = () => {
  const location = useLocation()
  const isWorldsend = () => location.pathname.startsWith('/songs/worldsend')

  return (
    <nav
      aria-label="楽曲一覧切り替え"
      class="flex items-center rounded-full bg-gray-900 p-0.5 text-xs font-medium shadow-sm"
    >
      <A
        href="/songs"
        class={`rounded-full px-3 py-1.5 transition-colors ${
          isWorldsend() ? 'text-gray-400 hover:text-white' : 'bg-primary-500 text-white shadow-sm'
        }`}
        aria-current={!isWorldsend() ? 'page' : undefined}
      >
        Standard
      </A>
      <A
        href="/songs/worldsend"
        class={`rounded-full px-3 py-1.5 transition-colors ${
          isWorldsend() ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:text-white'
        }`}
        aria-current={isWorldsend() ? 'page' : undefined}
      >
        WORLD&apos;S END
      </A>
    </nav>
  )
}

export default SongsViewToggle

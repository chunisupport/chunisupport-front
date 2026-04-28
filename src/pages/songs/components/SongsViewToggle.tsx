import { A, useLocation } from '@solidjs/router'
import { createMemo } from 'solid-js'

const SongsViewToggle = () => {
  const location = useLocation()
  const isWorldsend = () => location.pathname.startsWith('/songs/worldsend')

  const nextView = createMemo(() =>
    isWorldsend()
      ? {
          href: '/songs',
          label: '通常譜面',
        }
      : {
          href: '/songs/worldsend',
          label: "WORLD'S END",
        }
  )

  return (
    <nav aria-label="楽曲一覧切り替え" class="flex items-center">
      <A
        href={nextView().href}
        class="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700"
      >
        {nextView().label}
      </A>
    </nav>
  )
}

export default SongsViewToggle

import { A, useLocation } from '@solidjs/router'
import { createMemo } from 'solid-js'

const SongsViewToggle = () => {
  const location = useLocation()
  const isWorldsend = () => location.pathname.startsWith('/songs/worldsend')

  const nextView = createMemo(() =>
    isWorldsend()
      ? {
          href: '/songs',
          label: 'STANDARD',
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
        class="rounded-md bg-action-primary px-3 py-1.5 text-xs font-medium text-text-inverse transition-colors hover:bg-action-primary-hover"
      >
        {nextView().label}
      </A>
    </nav>
  )
}

export default SongsViewToggle

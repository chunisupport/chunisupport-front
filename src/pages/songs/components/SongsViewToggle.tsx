import { A, useLocation } from '@solidjs/router'
import { createMemo } from 'solid-js'
import { getAppButtonClass } from '../../../components/common/AppButton'

/**
 * 通常曲とWORLD'S ENDの楽曲一覧を切り替える。
 *
 * @returns 切り替え先を表示する一覧ナビゲーション。
 */
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
        class={getAppButtonClass({
          variant: 'primary',
          size: 'md',
          class: 'h-10 whitespace-nowrap',
        })}
      >
        {nextView().label}
      </A>
    </nav>
  )
}

export default SongsViewToggle

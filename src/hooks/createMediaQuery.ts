import { type Accessor, createSignal, onCleanup } from 'solid-js'

/**
 * メディアクエリの一致状態を購読する。
 *
 * @param query - 監視するメディアクエリ。
 * @returns クエリに一致しているかを返すアクセサ。
 */
export const createMediaQuery = (query: string): Accessor<boolean> => {
  if (typeof window === 'undefined') return () => false

  const mediaQueryList = window.matchMedia(query)
  const [matches, setMatches] = createSignal(mediaQueryList.matches)
  const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches)

  mediaQueryList.addEventListener('change', handleChange)
  onCleanup(() => mediaQueryList.removeEventListener('change', handleChange))

  return matches
}

import { Star } from 'lucide-solid'
import { Show } from 'solid-js'
import { addMyFavoriteSong, deleteMyFavoriteSong, fetchUserFavoriteSongs } from '../../../api/users'
import { authSession } from '../../../stores/authSession'
import { SONG_DETAIL_FAVORITE_COPY } from '../constants'
import { createSongDetailSetting } from './createSongDetailSetting'
import SongSettingButton from './SongSettingButton'

type Props = {
  songId: string
}

/**
 * 通常楽曲のお気に入り状態を取得し、登録・解除するボタンを表示する。
 *
 * @param props - 操作対象の楽曲ID。
 * @returns お気に入りの星ボタンと操作エラー。
 */
const SongFavoriteButton = (props: Props) => {
  const username = () =>
    authSession.status === 'authenticated' ? authSession.user?.username : undefined
  const setting = createSongDetailSetting({
    username,
    songId: () => props.songId,
    load: async ({ username, songId }) => {
      const response = await fetchUserFavoriteSongs(username)
      return response.items.some((item) => item.id === songId)
    },
    save: async (_current, next, { songId }) => {
      if (next) await addMyFavoriteSong({ id: songId })
      else await deleteMyFavoriteSong(songId)
    },
    loadError: SONG_DETAIL_FAVORITE_COPY.loadError,
    saveError: SONG_DETAIL_FAVORITE_COPY.saveError,
  })
  const registered = () => setting.value() ?? false

  return (
    <div class="space-y-1">
      <SongSettingButton
        label={SONG_DETAIL_FAVORITE_COPY.label}
        pressed={registered()}
        busy={setting.busy()}
        title={
          !username()
            ? SONG_DETAIL_FAVORITE_COPY.loginRequired
            : registered()
              ? SONG_DETAIL_FAVORITE_COPY.remove
              : SONG_DETAIL_FAVORITE_COPY.add
        }
        disabled={setting.disabled()}
        onClick={() => void setting.save(!registered())}
      >
        <Star
          class={`h-5 w-5 ${registered() ? 'fill-action-primary text-action-primary' : ''}`}
          aria-hidden="true"
        />
      </SongSettingButton>
      <Show when={setting.errorMessage()}>
        {(message) => (
          <p class="max-w-64 text-sm text-danger" role="alert">
            {message()}
          </p>
        )}
      </Show>
    </div>
  )
}

export default SongFavoriteButton

import { LockKeyhole, LockKeyholeOpen } from 'lucide-solid'
import { Show } from 'solid-js'
import { addMyLockedSong, deleteMyLockedSong, fetchUserLockedSongs } from '../../../api/users'
import { authSession } from '../../../stores/authSession'
import { SONG_DETAIL_LOCKED_COPY } from '../constants'
import { createSongDetailSetting } from './createSongDetailSetting'
import SongSettingButton from './SongSettingButton'

type Props = {
  songId: string
  hasUltima: boolean
}

/**
 * 楽曲全体とULTIMA専用の未解禁設定を切り替えるボタンを表示する。
 *
 * @param props - 楽曲IDとULTIMA譜面の有無。
 * @returns 通常とULTIMAの南京錠ボタン、および操作エラー。
 */
const SongLockedButtons = (props: Props) => {
  const username = () =>
    authSession.status === 'authenticated' ? authSession.user?.username : undefined
  const setting = createSongDetailSetting({
    username,
    songId: () => props.songId,
    load: async ({ username, songId }) => {
      const response = await fetchUserLockedSongs(username)
      return {
        normal: response.items.some((item) => item.id === songId && !item.is_ultima),
        ultima: response.items.some((item) => item.id === songId && item.is_ultima),
      }
    },
    save: async (current, next, { songId }) => {
      for (const isUltima of [false, true]) {
        const key = isUltima ? 'ultima' : 'normal'
        if (current[key] === next[key]) continue
        const request = { id: songId, is_ultima: isUltima }
        if (next[key]) await addMyLockedSong(request)
        else await deleteMyLockedSong(request)
      }
    },
    loadError: SONG_DETAIL_LOCKED_COPY.loadError,
    saveError: SONG_DETAIL_LOCKED_COPY.saveError,
  })

  /**
   * 対象の未解禁設定とその操作を表示する。
   *
   * @param isUltima - ULTIMA専用ボタンの場合はtrue。
   * @returns 設定状態に対応する南京錠ボタン。
   */
  const renderButton = (isUltima: boolean) => {
    const key = isUltima ? 'ultima' : 'normal'
    const locked = () => setting.value()?.[key] ?? false
    return (
      <SongSettingButton
        label={isUltima ? SONG_DETAIL_LOCKED_COPY.ultimaLabel : SONG_DETAIL_LOCKED_COPY.normalLabel}
        title={
          !username()
            ? SONG_DETAIL_LOCKED_COPY.loginRequired
            : locked()
              ? isUltima
                ? SONG_DETAIL_LOCKED_COPY.ultimaUnlock
                : SONG_DETAIL_LOCKED_COPY.unlock
              : isUltima
                ? SONG_DETAIL_LOCKED_COPY.ultimaLock
                : SONG_DETAIL_LOCKED_COPY.lock
        }
        pressed={locked()}
        accentBackground
        busy={setting.busy()}
        disabled={setting.disabled()}
        onClick={() => {
          const current = setting.value()
          if (current) void setting.save({ ...current, [key]: !locked() })
        }}
      >
        <Show when={locked()} fallback={<LockKeyholeOpen class="h-5 w-5" aria-hidden="true" />}>
          <LockKeyhole class="h-5 w-5" aria-hidden="true" />
        </Show>
        <Show when={isUltima}>
          <span
            class="absolute right-1 top-1 origin-top-right scale-75 bg-inherit px-0.5 py-0.5 font-oswald text-xs font-semibold leading-none [text-box:trim-both_cap_alphabetic]"
            aria-hidden="true"
          >
            {SONG_DETAIL_LOCKED_COPY.ultimaBadge}
          </span>
        </Show>
      </SongSettingButton>
    )
  }

  return (
    <div class="space-y-1">
      <div class="flex items-start gap-2">
        {renderButton(false)}
        <Show when={props.hasUltima}>{renderButton(true)}</Show>
      </div>
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

export default SongLockedButtons

import { Link } from '@kobalte/core/link'
import { A } from '@solidjs/router'
import { ArrowRight, ExternalLink, RefreshCw, UserRound } from 'lucide-solid'
import { createResource, Match, Show, Switch } from 'solid-js'
import { fetchUserProfileSummary } from '../../api/users'
import { fetchLandingProfile } from '../../usecases/auth/fetchLandingProfile'
import { fetchUserRatingWithCache } from '../../usecases/cache/fetchUserRatingWithCache'
import { buildUserProfilePagePath } from '../../utils/userProfileRoute'
import { AppButton, getAppButtonClass } from '../common/AppButton'
import { UserNameplate } from '../common/profile/UserNameplate'
import { USER_NAMEPLATE_WIDTH_CLASS } from '../common/profile/UserNameplate.constants'
import Loading from '../Loading/Loading'
import { DATA_REGISTRATION_HELP_URL } from '../PlayerDataEmptyState/constants'
import { LANDING_PROFILE_COPY } from './constants'

/**
 * ログイン中のユーザーの名札と、データ未登録時の登録導線を表示する。
 *
 * @param props - ログイン中の公開ユーザー名。
 * @returns 称号・指標を含む名札、または未登録・取得失敗のカード。
 */
export const LandingProfileCard = (props: { username: string }) => {
  const [profile, { refetch }] = createResource(
    () => props.username,
    (username) =>
      fetchLandingProfile(username, {
        fetchProfile: fetchUserProfileSummary,
        fetchRating: fetchUserRatingWithCache,
      })
  )
  /**
   * 名札を描画できる取得結果を返す。
   * @returns 登録済みデータ。未登録または取得失敗の場合は undefined。
   */
  const loadedProfile = () => {
    const result = profile()
    return result?.type === 'loaded' ? result : undefined
  }
  /**
   * 各表示状態で共通のマイページ導線を生成する。
   * @returns マイページへのリンク。
   */
  const myPageLink = () => (
    <A
      href={buildUserProfilePagePath(props.username, 'rating_best')}
      class={getAppButtonClass({ variant: 'surface', fullWidth: true })}
    >
      {LANDING_PROFILE_COPY.myPage}
      <ArrowRight class="h-4 w-4" aria-hidden="true" />
    </A>
  )

  return (
    <section class={USER_NAMEPLATE_WIDTH_CLASS} aria-label={LANDING_PROFILE_COPY.heading}>
      <Show
        when={!profile.loading}
        fallback={
          <div class="rounded-lg border border-border bg-surface p-6">
            <Loading />
          </div>
        }
      >
        <Show
          when={loadedProfile()}
          fallback={
            <div class="rounded-lg border border-action-primary-border bg-gradient-to-br from-surface to-action-primary-muted p-6 shadow-sm">
              <div class="mb-5 flex items-center gap-4">
                <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-action-primary-border bg-action-primary-muted text-action-primary">
                  <UserRound class="h-7 w-7" aria-hidden="true" />
                </div>
                <h1 class="min-w-0 break-all font-sans text-xl font-semibold text-text">
                  @{props.username}
                </h1>
              </div>
              <Switch>
                <Match when={profile()?.type === 'empty'}>
                  <p class="mb-4 text-sm font-medium text-text-muted">
                    {LANDING_PROFILE_COPY.empty}
                  </p>
                  <Link
                    href={DATA_REGISTRATION_HELP_URL}
                    target="_blank"
                    rel="noreferrer"
                    class={getAppButtonClass({ variant: 'primary', fullWidth: true })}
                  >
                    {LANDING_PROFILE_COPY.register}
                    <ExternalLink class="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Match>
                <Match when={profile()?.type === 'error'}>
                  <p class="mb-3 text-sm text-danger" role="alert">
                    {LANDING_PROFILE_COPY.failed}
                  </p>
                  <AppButton
                    variant="surface"
                    fullWidth
                    onClick={() => void refetch()}
                    leftIcon={<RefreshCw class="h-4 w-4" aria-hidden="true" />}
                  >
                    {LANDING_PROFILE_COPY.retry}
                  </AppButton>
                </Match>
              </Switch>
              <div class="mt-3">{myPageLink()}</div>
            </div>
          }
        >
          {(data) => (
            <>
              <p class="mb-1.5 flex items-center justify-end gap-1 px-1 font-sans text-sm text-text-muted">
                <UserRound class="h-4 w-4 shrink-0" aria-hidden="true" />
                <span class="min-w-0 truncate">@{props.username}</span>
              </p>
              <UserNameplate
                playerInfo={data().player}
                honors={data().player.honors}
                rating={data().rating}
                widthClass="w-full"
                footer={myPageLink()}
              />
            </>
          )}
        </Show>
      </Show>
    </section>
  )
}

import { A } from '@solidjs/router'
import { createQuery } from '@tanstack/solid-query'
import ArrowRight from 'lucide-solid/icons/arrow-right'
import Bell from 'lucide-solid/icons/bell'
import ChartNoAxesCombined from 'lucide-solid/icons/chart-no-axes-combined'
import ChevronRight from 'lucide-solid/icons/chevron-right'
import Dices from 'lucide-solid/icons/dices'
import FlagTriangleRight from 'lucide-solid/icons/flag-triangle-right'
import Grid3x3 from 'lucide-solid/icons/grid-3x3'
import History from 'lucide-solid/icons/history'
import Megaphone from 'lucide-solid/icons/megaphone'
import Music from 'lucide-solid/icons/music'
import Swords from 'lucide-solid/icons/swords'
import Target from 'lucide-solid/icons/target'
import UserRound from 'lucide-solid/icons/user-round'
import UsersRound from 'lucide-solid/icons/users-round'
import Wrench from 'lucide-solid/icons/wrench'
import { type Component, createMemo, createSignal, For, Match, Show, Switch } from 'solid-js'
import { Announcements, Loading, X_TIMELINE_HEADING, XTimeline } from '../../components'
import { AppButton, getAppButtonClass } from '../../components/common/AppButton'
import { AppDialog } from '../../components/common/AppDialog'
import { NotificationDot } from '../../components/common/NotificationDot'
import { UserNameplate } from '../../components/common/profile/UserNameplate'
import {
  USER_NAMEPLATE_FOOTER_CLASS,
  USER_NAMEPLATE_MAX_WIDTH_CLASS,
} from '../../components/common/profile/UserNameplate.constants'
import { TOOLS_PATH } from '../../constants/routes'
import type { ToolLinkIcon } from '../../constants/tools'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { userLandingProfileQueryOptions } from '../../queries/users'
import { authSession } from '../../stores/authSession'
import { friendRequestNotification } from '../../stores/friendRequestNotification'
import { buildUserProfilePagePath, buildUserStatsPagePath } from '../../utils/userProfileRoute'
import {
  DUMMY_APP_BANNER_ANNOUNCEMENTS,
  DUMMY_APP_MODAL_ANNOUNCEMENT,
  DUMMY_HOME_PLAYER,
  DUMMY_HOME_RATING,
  DUMMY_HOME_USERNAME,
  type DummyAppAnnouncement,
  FEATURED_TOOLS,
  PROFILE_TAB_SHORTCUTS,
  QUICK_ACCESS_ITEMS,
  type QuickAccessIcon,
  TEST_HOME_COPY,
} from './constants'

/**
 * クイックアクセスカードの種別に対応するアイコンを表示する。
 *
 * @param props - 表示するアイコン種別。
 * @returns クイックアクセス用アイコン。
 */
const QuickAccessCardIcon: Component<{ icon: QuickAccessIcon }> = (props) => {
  const iconClass = 'h-5 w-5 text-action-primary'

  return (
    <Switch>
      <Match when={props.icon === 'history'}>
        <History class={iconClass} aria-hidden="true" />
      </Match>
      <Match when={props.icon === 'goals'}>
        <FlagTriangleRight class={iconClass} aria-hidden="true" />
      </Match>
      <Match when={props.icon === 'friends'}>
        <UsersRound class={iconClass} aria-hidden="true" />
      </Match>
      <Match when={props.icon === 'songs'}>
        <Music class={iconClass} aria-hidden="true" />
      </Match>
    </Switch>
  )
}

/**
 * ピックアップツールカードに対応するアイコンを表示する。
 *
 * @param props - 表示するツールアイコン種別。
 * @returns ツール用アイコン。
 */
const FeaturedToolIcon: Component<{ icon: ToolLinkIcon }> = (props) => {
  const iconClass = 'h-5 w-5 text-action-primary'

  return (
    <Switch fallback={<Wrench class={iconClass} aria-hidden="true" />}>
      <Match when={props.icon === 'chart'}>
        <ChartNoAxesCombined class={iconClass} aria-hidden="true" />
      </Match>
      <Match when={props.icon === 'target'}>
        <Target class={iconClass} aria-hidden="true" />
      </Match>
      <Match when={props.icon === 'random'}>
        <Dices class={iconClass} aria-hidden="true" />
      </Match>
      <Match when={props.icon === 'friendVs'}>
        <Swords class={iconClass} aria-hidden="true" />
      </Match>
      <Match when={props.icon === 'matrix'}>
        <Grid3x3 class={iconClass} aria-hidden="true" />
      </Match>
    </Switch>
  )
}

/**
 * Issue #417 想定のアプリ内お知らせバナー（本文型・リンク型）を表示する。
 *
 * @param props - 表示するお知らせデータ。
 * @returns お知らせバナーカード。
 */
const AppAnnouncementBannerCard: Component<{ item: DummyAppAnnouncement }> = (props) => {
  const renderContent = () => (
    <div class="flex items-start gap-3">
      <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-action-primary-muted text-action-primary">
        <Megaphone class="h-4 w-4" aria-hidden="true" />
      </span>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full border border-action-primary-border bg-action-primary-muted px-2 py-0.5 text-[11px] font-semibold text-action-primary">
            {props.item.badgeLabel}
          </span>
          <p class="font-sans text-sm font-semibold text-text">{props.item.title}</p>
        </div>
        <p class="mt-1 font-sans text-xs text-text-muted">{props.item.body}</p>
      </div>
      <Show when={props.item.kind === 'link' && props.item.targetPath}>
        <span class="mt-1 inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-action-primary">
          {props.item.actionLabel ?? TEST_HOME_COPY.modalDetailLinkLabel}
          <ChevronRight class="h-4 w-4" aria-hidden="true" />
        </span>
      </Show>
    </div>
  )

  return (
    <Show
      when={props.item.kind === 'link' && props.item.targetPath}
      fallback={
        <div class="rounded-lg border border-action-primary-border bg-surface p-3.5 shadow-sm">
          {renderContent()}
        </div>
      }
    >
      {(targetPath) => (
        <A
          href={targetPath()}
          class="block rounded-lg border border-action-primary-border bg-surface p-3.5 shadow-sm transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {renderContent()}
        </A>
      )}
    </Show>
  )
}

/**
 * ランディング・ハブとしての新しいホーム画面の試作ページを表示する。
 * ログイン中でデータがある場合は実データを表示し、未ログイン・未登録時はダミーデータでレイアウトを確認できる。
 *
 * @returns 試作ホーム画面。
 */
const TestHomePage: Component = () => {
  useDocumentTitle(TEST_HOME_COPY.documentTitle)

  const [showAnnouncementModal, setShowAnnouncementModal] = createSignal(false)

  const authenticatedUsername = () =>
    authSession.status === 'authenticated' ? (authSession.user?.username ?? null) : null

  const profileQuery = createQuery(() => userLandingProfileQueryOptions(authenticatedUsername()))

  const resolvedProfile = createMemo(() => {
    const username = authenticatedUsername()
    const data = profileQuery.data
    if (username && data?.type === 'loaded') {
      return {
        username,
        player: data.player,
        rating: data.rating,
        isDummy: false,
      }
    }

    return {
      username: username ?? DUMMY_HOME_USERNAME,
      player: DUMMY_HOME_PLAYER,
      rating: DUMMY_HOME_RATING,
      isDummy: true,
    }
  })

  const isLoadingProfile = () =>
    Boolean(authenticatedUsername()) && profileQuery.isPending && profileQuery.data === undefined

  return (
    <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
      {/* 試作プレビューバー（ポップアップお知らせの確認トリガー含む） */}
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-1.5">
          <span class="rounded-full border border-action-primary-border bg-action-primary-muted px-2.5 py-0.5 text-xs font-medium text-action-primary">
            {TEST_HOME_COPY.previewBadge}
          </span>
          <Show when={resolvedProfile().isDummy}>
            <span class="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
              {TEST_HOME_COPY.dummyDataNote}
            </span>
          </Show>
        </div>
        <AppButton
          variant="surface"
          size="sm"
          leftIcon={<Bell class="h-4 w-4 text-action-primary" aria-hidden="true" />}
          onClick={() => setShowAnnouncementModal(true)}
        >
          {TEST_HOME_COPY.modalPreviewButton}
        </AppButton>
      </div>

      {/* アプリ内お知らせバナー（Issue #417 想定：記事にするほどではない小アップデート・期間限定案内） */}
      <section aria-label={TEST_HOME_COPY.appBannersHeading} class="flex flex-col gap-2">
        <For each={DUMMY_APP_BANNER_ANNOUNCEMENTS}>
          {(item) => <AppAnnouncementBannerCard item={item} />}
        </For>
      </section>

      {/* プレイヤー名札 + マイページ各タブへのダイレクト導線 */}
      <section
        class={`mx-auto w-full ${USER_NAMEPLATE_MAX_WIDTH_CLASS}`}
        aria-label={TEST_HOME_COPY.profileHeading}
      >
        <p class="mb-1.5 flex items-center justify-end gap-1 px-1 font-sans text-sm text-text-muted">
          <UserRound class="h-4 w-4 shrink-0" aria-hidden="true" />
          <span class="min-w-0 truncate">@{resolvedProfile().username}</span>
        </p>

        <Show
          when={!isLoadingProfile()}
          fallback={
            <div class="rounded-lg border border-border bg-surface p-6">
              <Loading />
            </div>
          }
        >
          <UserNameplate
            playerInfo={resolvedProfile().player}
            honors={resolvedProfile().player.honors}
            rating={resolvedProfile().rating}
            possessionName={resolvedProfile().player.possession}
            historyHref={buildUserStatsPagePath(resolvedProfile().username)}
            widthClass="w-full"
            footer={
              <div class={USER_NAMEPLATE_FOOTER_CLASS}>
                <div class="grid grid-cols-3 gap-1.5">
                  <For each={PROFILE_TAB_SHORTCUTS}>
                    {(shortcut) => (
                      <A
                        href={buildUserProfilePagePath(resolvedProfile().username, shortcut.page)}
                        class={`${getAppButtonClass({ variant: 'surface', size: 'sm', fullWidth: true })} px-2 text-xs`}
                      >
                        <span class="truncate">{shortcut.label}</span>
                      </A>
                    )}
                  </For>
                </div>
              </div>
            }
          />
        </Show>
      </section>

      {/* クイックアクセス（普段使い・その他メニュー内の主要機能） */}
      <section aria-labelledby="test-home-quick-access-heading">
        <h2 id="test-home-quick-access-heading" class="mb-3 text-lg font-semibold text-text">
          {TEST_HOME_COPY.quickAccessHeading}
        </h2>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <For each={QUICK_ACCESS_ITEMS}>
            {(item) => {
              const showFriendDot = () =>
                item.id === 'friends' &&
                (friendRequestNotification.hasPendingReceivedRequest || resolvedProfile().isDummy)

              return (
                <A
                  href={item.href}
                  class="group relative flex flex-col justify-between gap-3 rounded-lg border border-border bg-surface p-3.5 shadow-sm transition-colors hover:border-border-strong hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <div class="flex items-start justify-between gap-2">
                    <span class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-action-primary-muted">
                      <QuickAccessCardIcon icon={item.icon} />
                      <NotificationDot visible={showFriendDot()} class="-top-1 -right-1" />
                    </span>
                    <ChevronRight
                      class="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </div>
                  <div class="min-w-0">
                    <p class="truncate font-sans text-sm font-semibold text-text">{item.label}</p>
                    <p class="mt-0.5 flex items-baseline gap-1.5 truncate text-xs text-text-muted">
                      <Show when={item.dummyMetric !== ''}>
                        <span class="font-jost text-sm font-semibold text-action-primary">
                          {item.dummyMetric}
                        </span>
                      </Show>
                      <span class="truncate font-sans">{item.dummySubLabel}</span>
                    </p>
                  </div>
                </A>
              )
            }}
          </For>
        </div>
      </section>

      {/* Docs お知らせ記事 + ピックアップツール */}
      <div class="grid gap-6 md:grid-cols-2 md:items-start">
        <Announcements />

        <section class="min-w-0" aria-labelledby="test-home-tools-heading">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h2 id="test-home-tools-heading" class="text-xl font-semibold text-text">
              {TEST_HOME_COPY.toolsHeading}
            </h2>
            <A
              href={TOOLS_PATH}
              class="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-action-primary underline hover:text-action-primary-hover"
            >
              {TEST_HOME_COPY.allToolsLink}
              <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
            </A>
          </div>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
            <For each={FEATURED_TOOLS}>
              {(tool) => (
                <A
                  href={tool.href}
                  class="group flex items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm transition-colors hover:border-border-strong hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-action-primary-muted">
                    <FeaturedToolIcon icon={tool.icon} />
                  </span>
                  <span class="min-w-0 flex-1 truncate font-sans text-sm font-semibold text-text">
                    {tool.title}
                  </span>
                  <ChevronRight
                    class="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </A>
              )}
            </For>
          </div>
        </section>
      </div>

      {/* X タイムライン */}
      <section class="min-w-0">
        <h2 class="mb-3 text-xl font-semibold text-text">{X_TIMELINE_HEADING}</h2>
        <XTimeline />
      </section>

      {/* Issue #417 想定の全画面ポップアップお知らせ（プレビュー確認用） */}
      <AppDialog
        open={showAnnouncementModal()}
        onOpenChange={setShowAnnouncementModal}
        size="md"
        fontSans
        closeLabel={TEST_HOME_COPY.modalCloseLabel}
        title={
          <span class="inline-flex items-center gap-2">
            <span class="rounded-full border border-action-primary-border bg-action-primary-muted px-2 py-0.5 text-xs font-semibold text-action-primary">
              {DUMMY_APP_MODAL_ANNOUNCEMENT.badgeLabel}
            </span>
            <span>{DUMMY_APP_MODAL_ANNOUNCEMENT.title}</span>
          </span>
        }
        footer={
          <div class="mt-5 flex flex-wrap justify-end gap-2">
            <Show when={DUMMY_APP_MODAL_ANNOUNCEMENT.targetPath}>
              {(targetPath) => (
                <A
                  href={targetPath()}
                  onClick={() => setShowAnnouncementModal(false)}
                  class={getAppButtonClass({ variant: 'surface' })}
                >
                  {DUMMY_APP_MODAL_ANNOUNCEMENT.actionLabel ?? TEST_HOME_COPY.modalDetailLinkLabel}
                  <ArrowRight class="h-4 w-4" aria-hidden="true" />
                </A>
              )}
            </Show>
            <AppButton variant="primary" onClick={() => setShowAnnouncementModal(false)}>
              {TEST_HOME_COPY.modalConfirmLabel}
            </AppButton>
          </div>
        }
      >
        <p class="mt-3 text-sm leading-relaxed text-text-muted">
          {DUMMY_APP_MODAL_ANNOUNCEMENT.body}
        </p>
      </AppDialog>
    </div>
  )
}

export default TestHomePage

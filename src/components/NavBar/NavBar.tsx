import { AlertDialog } from '@kobalte/core/alert-dialog'
import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { DropdownMenu } from '@kobalte/core/dropdown-menu'
import { A, useLocation, useNavigate } from '@solidjs/router'
import {
  BadgeQuestionMark,
  Ellipsis,
  FlagTriangleRight,
  House,
  LogOut,
  Music,
  Palette,
  Settings,
  Shield,
  Wrench,
} from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createSignal, For, onCleanup, onMount } from 'solid-js'
import { isHomePath } from './navItemMatching'

type NavBarProps = {
  children: JSX.Element
}

import { signOut } from 'firebase/auth'
import { fetchMe } from '../../api/users'
import { auth } from '../../lib/firebase'
import { authSession, clearAuthenticatedUser } from '../../stores/authSession'
import { resolveAuthSession } from '../../usecases/auth/resolveAuthSession'
import {
  applyThemePreference,
  readThemePreference,
  saveThemePreference,
  subscribeSystemThemeChange,
  type ThemePreference,
} from '../../utils/themePreference'

type DropdownItem = {
  label: string
  icon: () => JSX.Element
  path?: string
  action?: 'theme'
}

const THEME_OPTIONS = [
  {
    value: 'system',
    label: 'システム',
    description: '端末の表示設定に合わせます。',
  },
  {
    value: 'light',
    label: 'ライト',
    description: '明るい配色で固定します。',
  },
  {
    value: 'dark',
    label: 'ダーク',
    description: '暗い配色で固定します。',
  },
] as const satisfies readonly {
  value: ThemePreference
  label: string
  description: string
}[]

type NavItem = {
  id: 'home' | 'goals' | 'tools' | 'songs' | 'others'
  label: string
  path: string
  icon: () => JSX.Element
  matchPattern?: RegExp
  matchPrefix?: boolean
  dropdown?: DropdownItem[]
  requiresAuth?: boolean
}

const NavBar = (props: NavBarProps) => {
  const [showLoginDialog, setShowLoginDialog] = createSignal(false)
  const [showLogoutDialog, setShowLogoutDialog] = createSignal(false)
  const [showThemeDialog, setShowThemeDialog] = createSignal(false)
  const [themePreference, setThemePreference] = createSignal<ThemePreference>(readThemePreference())

  const username = () => authSession.user?.username ?? null
  const isLoading = () => authSession.status === 'unknown'

  const location = useLocation()
  const navigate = useNavigate()

  // ナビゲーション項目の定義
  const getNavItems = (): NavItem[] => {
    const uname = username()
    const userPath = uname ? `/users/${encodeURIComponent(uname)}` : '#'
    const dropdownBase: DropdownItem[] = [
      // 設定・ログアウトはログイン時のみ
      ...(uname
        ? [
            ...(authSession.user?.account_type === 'ADMIN'
              ? [
                  {
                    label: '管理メニュー',
                    icon: () => <Shield class="inline h-4 w-4 mr-1" aria-hidden="true" />,
                    path: '/admin',
                  },
                ]
              : []),
            {
              label: '設定',
              icon: () => <Settings class="inline h-4 w-4 mr-1" aria-hidden="true" />,
              path: '/settings',
            },
          ]
        : []),
      {
        label: '表示テーマ',
        icon: () => <Palette class="inline h-4 w-4 mr-1" aria-hidden="true" />,
        action: 'theme',
      },
      {
        label: 'ヘルプ',
        icon: () => <BadgeQuestionMark class="inline h-4 w-4 mr-1" aria-hidden="true" />,
        path: 'https://example.com',
      },
      ...(uname
        ? [
            {
              label: 'ログアウト',
              icon: () => <LogOut class="inline h-4 w-4 mr-1" aria-hidden="true" />,
              path: '#', // ページ遷移しない
            },
          ]
        : []),
    ]

    return [
      {
        id: 'home',
        label: 'ホーム',
        path: userPath,
        icon: () => <House class="h-6 w-6" aria-hidden="true" />,
        requiresAuth: true,
      },
      {
        id: 'goals',
        label: '目標',
        path: '/goals',
        icon: () => <FlagTriangleRight class="h-6 w-6" aria-hidden="true" />,
        matchPrefix: true,
        requiresAuth: true,
      },
      {
        id: 'tools',
        label: 'ツール',
        path: '/tools',
        icon: () => <Wrench class="h-6 w-6" aria-hidden="true" />,
        matchPrefix: true,
      },
      {
        id: 'songs',
        label: '楽曲DB',
        path: '/songs',
        icon: () => <Music class="h-6 w-6" aria-hidden="true" />,
        matchPrefix: true,
      },
      {
        id: 'others',
        label: 'その他',
        path: '#',
        matchPattern: /a^/, // マッチしないダミーパターン
        icon: () => <Ellipsis class="h-6 w-6" aria-hidden="true" />,
        dropdown: dropdownBase,
      },
    ]
  }

  // コンポーネントマウント時に認証セッションを解決する
  // resolveAuthSession 内で重複フェッチが排除されるため、RequireAuth と同時にマウントされても API 呼び出しは1回のみ
  onMount(() => {
    resolveAuthSession(() => fetchMe({ redirectOnUnauthorized: false }))
  })

  onMount(() => {
    const unsubscribeSystemThemeChange = subscribeSystemThemeChange(themePreference)
    onCleanup(unsubscribeSystemThemeChange)
  })

  const isActive = (item: NavItem) => {
    const pathname = location.pathname

    // ユーザーページ系のパス（/users/:username...）の場合は、
    // 表示中のユーザー名が現在の認証ユーザーと一致する場合のみアクティブとする
    const authUser = authSession.user
    const userMatch = pathname.match(/^\/users\/([^/]+)/)
    if (userMatch && authUser) {
      const viewedUsername = decodeURIComponent(userMatch[1])
      if (viewedUsername !== authUser.username) {
        return false
      }
    }

    if (item.id === 'home') {
      return isHomePath(pathname)
    }

    if (item.matchPattern) {
      return item.matchPattern.test(pathname)
    }
    if (item.matchPrefix) {
      return pathname.startsWith(item.path)
    }
    return pathname === item.path
  }

  /**
   * その他メニューの項目選択を処理する。
   * @param item 選択されたメニュー項目
   * @returns なし
   */
  const handleDropdownSelect = (item: DropdownItem) => {
    if (item.action === 'theme') {
      // モバイル環境では、DropdownMenu のクローズ時フォーカス復元と Dialog オープン時フォーカス奪取が
      // 同一タップ内で競合し、ダイアログが開いてすぐ閉じることがあるため、次のイベントループで開く。
      window.setTimeout(() => {
        setShowThemeDialog(true)
      }, 0)
      return
    }

    const path = item.path ?? '#'
    if (path.startsWith('http')) {
      window.open(path, '_blank', 'noopener,noreferrer')
    } else {
      navigate(path)
    }
  }

  /**
   * テーマ設定を保存して現在の画面へ適用する。
   * @param preference 適用するテーマ設定
   * @returns なし
   */
  const handleThemePreferenceChange = (preference: ThemePreference) => {
    setThemePreference(preference)
    saveThemePreference(preference)
    applyThemePreference(preference)
  }

  const handleLogout = async () => {
    await signOut(auth)
    clearAuthenticatedUser()
    setShowLogoutDialog(false)
    navigate('/login')
  }

  return (
    <div class="h-dvh overflow-hidden flex md:flex-row flex-col">
      {/* PC用nav-bar 768px以上 */}
      {/* TODO: lg以上では段階的にサイドナビゲーションバーの大きさを変化させる */}
      <aside class="hidden md:flex md:w-24 md:flex-col md:border-r md:border-border md:bg-surface">
        <nav class="flex flex-1 flex-col px-2 py-6">
          <For each={getNavItems()}>
            {(item) =>
              item.dropdown ? (
                <DropdownMenu>
                  <DropdownMenu.Trigger class="flex flex-col items-center gap-1 w-full rounded-md px-3 py-2 text-xs font-semibold text-nav-text hover:bg-surface-hover focus:outline-none">
                    <span class="text-lg">{item.icon()}</span>
                    <span>{item.label}</span>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content class="absolute left-16 -top-12 ml-2 min-w-45 rounded-lg border border-border bg-surface shadow-sm py-2 z-50">
                      <For each={item.dropdown}>
                        {(d) =>
                          // ログアウト項目は赤色で表示
                          d.label === 'ログアウト' ? (
                            <DropdownMenu.Item
                              onSelect={() => setShowLogoutDialog(true)}
                              class="block px-4 py-2 text-sm text-danger hover:bg-danger-bg focus:bg-danger-bg outline-none cursor-pointer"
                            >
                              <span class="pr-2">{d.icon()}</span>
                              {d.label}
                            </DropdownMenu.Item>
                          ) : (
                            <DropdownMenu.Item
                              onSelect={() => handleDropdownSelect(d)}
                              class="block px-4 py-2 text-sm text-text-muted hover:bg-surface-hover focus:bg-surface-hover outline-none cursor-pointer"
                            >
                              <span class="pr-2">{d.icon()}</span>
                              {d.label}
                            </DropdownMenu.Item>
                          )
                        }
                      </For>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu>
              ) : // 未ログイン時はrequiresAuthがtrueの項目を押すと警告ダイアログを表示
              item.requiresAuth && !isLoading() && !username() ? (
                <button
                  type="button"
                  class="flex flex-col items-center gap-1 rounded-md px-0 py-3 text-xs font-semibold text-disabled-text w-full"
                  onClick={() => setShowLoginDialog(true)}
                >
                  <span class="text-lg">{item.icon()}</span>
                  <span>{item.label}</span>
                </button>
              ) : (
                <A
                  href={item.path}
                  class="flex flex-col items-center gap-1 rounded-md px-0 py-3 text-xs font-semibold text-nav-text hover:bg-surface-hover"
                  classList={{
                    '!bg-action-primary !text-text-inverse hover:!bg-action-primary-hover hover:!text-text-inverse':
                      isActive(item),
                  }}
                >
                  <span class="text-lg">{item.icon()}</span>
                  <span>{item.label}</span>
                </A>
              )
            }
          </For>
        </nav>
      </aside>

      <div class="flex flex-col min-h-0 flex-1 min-w-0">
        <main id="app-main" class="flex-1 min-h-0 overflow-y-auto">
          {props.children}
        </main>

        {/* スマホ用nav-bar 768px未満 */}
        <nav class="md:hidden z-40 flex items-center justify-between border-t border-border bg-surface p-2 shadow-sm">
          <For each={getNavItems()}>
            {(item) =>
              item.dropdown ? (
                <DropdownMenu>
                  <DropdownMenu.Trigger class="flex-1 flex flex-col items-center gap-1 rounded-md px-0 py-2 text-xs font-semibold text-nav-text justify-center">
                    <span class="text-lg">{item.icon()}</span>
                    <span>{item.label}</span>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 min-w-45 rounded-lg border border-border bg-surface shadow-sm py-2 z-50">
                      <For each={item.dropdown}>
                        {(d) =>
                          // ログアウト項目は赤色で表示
                          d.label === 'ログアウト' ? (
                            <DropdownMenu.Item
                              onSelect={() => setShowLogoutDialog(true)}
                              class="block px-4 py-2 text-sm text-danger hover:bg-danger-bg focus:bg-danger-bg outline-none cursor-pointer font-semibold"
                            >
                              <span class="pr-2">{d.icon()}</span>
                              {d.label}
                            </DropdownMenu.Item>
                          ) : (
                            <DropdownMenu.Item
                              onSelect={() => handleDropdownSelect(d)}
                              class="block px-4 py-2 text-sm text-text-muted hover:bg-surface-hover focus:bg-surface-hover outline-none cursor-pointer"
                            >
                              <span class="pr-2">{d.icon()}</span>
                              {d.label}
                            </DropdownMenu.Item>
                          )
                        }
                      </For>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu>
              ) : // 未ログイン時はrequiresAuthがtrueの項目を押すと警告ダイアログを表示
              item.requiresAuth && !isLoading() && !username() ? (
                <button
                  type="button"
                  class="flex-1 flex flex-col items-center gap-1 rounded-md px-0 py-2 text-xs font-semibold text-disabled-text justify-center"
                  onClick={() => setShowLoginDialog(true)}
                >
                  <span class="text-lg">{item.icon()}</span>
                  <span>{item.label}</span>
                </button>
              ) : (
                <A
                  href={item.path}
                  class="flex-1 flex flex-col items-center gap-1 rounded-md px-0 py-2 text-xs font-semibold text-nav-text justify-center"
                  classList={{
                    '!bg-action-primary !text-text-inverse hover:!bg-action-primary-hover hover:!text-text-inverse':
                      isActive(item),
                  }}
                >
                  <span class="text-lg">{item.icon()}</span>
                  <span>{item.label}</span>
                </A>
              )
            }
          </For>
        </nav>

        {/* 未ログイン警告ダイアログ */}
        <Dialog open={showLoginDialog()} onOpenChange={setShowLoginDialog}>
          <Dialog.Portal>
            <Dialog.Overlay class="fixed inset-0 bg-overlay z-50" />
            <Dialog.Content class="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg flex flex-col items-center">
              <Dialog.Title class="text-lg font-bold mb-2">ログインが必要です</Dialog.Title>
              <Dialog.Description class="mb-4 text-sm text-text-muted">
                この機能を利用するにはログインが必要です。
              </Dialog.Description>
              <div class="flex gap-4 mt-2">
                <button
                  type="button"
                  class="px-4 py-2 rounded bg-action-secondary hover:bg-action-secondary-hover"
                  onClick={() => setShowLoginDialog(false)}
                >
                  戻る
                </button>
                <button
                  type="button"
                  class="px-4 py-2 rounded bg-action-primary text-text-inverse hover:bg-action-primary-hover"
                  onClick={() => {
                    setShowLoginDialog(false)
                    navigate('/login')
                  }}
                >
                  ログイン画面へ
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>

        {/* ログアウト確認AlertDialog */}
        <AlertDialog open={showLogoutDialog()} onOpenChange={setShowLogoutDialog}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay class="fixed inset-0 bg-overlay z-50" />
            <AlertDialog.Content class="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg flex flex-col items-center">
              <AlertDialog.Title class="text-lg font-bold mb-2">
                ログアウトしますか？
              </AlertDialog.Title>
              <AlertDialog.Description class="mb-4 text-sm text-text-muted">
                本当にログアウトしますか？
              </AlertDialog.Description>
              <div class="flex gap-4 mt-2">
                <button
                  type="button"
                  class="px-4 py-2 rounded bg-action-secondary hover:bg-action-secondary-hover"
                  onClick={() => setShowLogoutDialog(false)}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  class="px-4 py-2 rounded bg-danger text-text-inverse hover:bg-danger-hover"
                  onClick={handleLogout}
                >
                  ログアウト
                </button>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog>

        <Dialog open={showThemeDialog()} onOpenChange={setShowThemeDialog}>
          <Dialog.Portal>
            <Dialog.Overlay class="fixed inset-0 bg-overlay z-50" />
            <Dialog.Content class="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg">
              <Dialog.Title class="text-lg font-bold text-text">表示テーマ</Dialog.Title>
              <Dialog.Description class="mt-2 text-sm text-text-muted">
                画面の配色をライト、ダーク、システム連動から選択します。
              </Dialog.Description>
              <div class="mt-4 grid gap-3">
                <For each={THEME_OPTIONS}>
                  {(option) => (
                    <Button
                      aria-pressed={themePreference() === option.value}
                      onClick={() => handleThemePreferenceChange(option.value)}
                      class={`rounded-lg border p-4 text-left transition hover:bg-surface-hover ${
                        themePreference() === option.value
                          ? 'border-action-primary bg-action-primary-muted'
                          : 'border-border bg-surface'
                      }`}
                    >
                      <span class="block text-sm font-semibold text-text">{option.label}</span>
                      <span class="mt-1 block text-xs text-text-muted">{option.description}</span>
                    </Button>
                  )}
                </For>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </div>
    </div>
  )
}

export default NavBar

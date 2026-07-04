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
  PencilLine,
  Settings,
  Shield,
  Wrench,
} from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createSignal, For, onMount } from 'solid-js'
import { isHomePath } from './navItemMatching'

type NavBarProps = {
  children: JSX.Element
}

import { signOut } from 'firebase/auth'
import { fetchMe } from '../../api/users'
import { DOCUMENTATION_BASE_URL } from '../../config'
import { EDITOR_SONGS_PATH } from '../../constants/routes'
import { auth } from '../../lib/firebase'
import { EDITOR_SONGS_TITLE } from '../../pages/editor/constants'
import { authSession, clearAuthenticatedUser } from '../../stores/authSession'
import { resolveAuthSession } from '../../usecases/auth/resolveAuthSession'
import { clearClientCache } from '../../usecases/cache/clearClientCache'
import { AppButton } from '../common/AppButton'
import AppearanceSettings from '../common/AppearanceSettings'
import { APPEARANCE_SETTINGS_COPY } from '../common/AppearanceSettings.constants'
import { AppMenuContent, AppMenuItem, AppMenuTrigger } from '../common/AppMenu'

/**
 * その他メニューに表示する項目を表す。
 * @property label 画面に表示する項目名
 * @property icon 項目名の左側に表示するアイコン要素を返す関数
 * @property path 選択時に遷移する内部パスまたは外部URL
 * @property action 遷移以外に実行するメニュー固有の操作
 */
type DropdownItem = {
  label: string
  icon: () => JSX.Element
  path?: string
  action?: 'theme' | 'logout'
}

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

/**
 * アプリケーション共通のナビゲーションと画面領域を表示する。
 * @param props ナビゲーション内に表示する画面要素
 * @returns ナビゲーション付きの画面レイアウト
 */
const NavBar = (props: NavBarProps) => {
  const [showLoginDialog, setShowLoginDialog] = createSignal(false)
  const [showLogoutDialog, setShowLogoutDialog] = createSignal(false)
  const [showThemeDialog, setShowThemeDialog] = createSignal(false)

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
                    icon: () => <Shield class="h-4 w-4" aria-hidden="true" />,
                    path: '/admin',
                  },
                ]
              : []),
            ...(authSession.user?.account_type === 'EDITOR'
              ? [
                  {
                    label: EDITOR_SONGS_TITLE,
                    icon: () => <PencilLine class="inline mr-1 h-4 w-4" aria-hidden="true" />,
                    path: EDITOR_SONGS_PATH,
                  },
                ]
              : []),
            {
              label: '設定',
              icon: () => <Settings class="h-4 w-4" aria-hidden="true" />,
              path: '/settings',
            },
          ]
        : []),
      {
        label: '表示テーマ',
        icon: () => <Palette class="h-4 w-4" aria-hidden="true" />,
        action: 'theme' as const,
      },
      {
        label: 'ヘルプ',
        icon: () => <BadgeQuestionMark class="h-4 w-4" aria-hidden="true" />,
        path: DOCUMENTATION_BASE_URL,
      },
      ...(uname
        ? [
            {
              label: 'ログアウト',
              icon: () => <LogOut class="h-4 w-4" aria-hidden="true" />,
              action: 'logout' as const,
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

    if (item.action === 'logout') {
      setShowLogoutDialog(true)
      return
    }

    const path = item.path ?? '#'
    if (path.startsWith('http')) {
      window.open(path, '_blank', 'noopener,noreferrer')
    } else {
      navigate(path)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    await clearClientCache().catch(() => undefined)
    clearAuthenticatedUser()
    setShowLogoutDialog(false)
    navigate('/login')
  }

  /**
   * その他メニューの項目を共通スタイルで描画する。
   *
   * @param item - 描画するメニュー項目。
   * @returns ドロップダウンメニュー項目。
   */
  const renderDropdownItem = (item: DropdownItem): JSX.Element => (
    <AppMenuItem
      icon={item.icon()}
      label={item.label}
      tone={item.action === 'logout' ? 'danger' : 'default'}
      onSelect={() => handleDropdownSelect(item)}
    />
  )

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
                  <AppMenuTrigger variant="navRail" label={item.label} icon={item.icon()} />
                  <DropdownMenu.Portal>
                    <AppMenuContent class="absolute left-16 -top-12 ml-2">
                      <For each={item.dropdown}>
                        {(dropdownItem) => renderDropdownItem(dropdownItem)}
                      </For>
                    </AppMenuContent>
                  </DropdownMenu.Portal>
                </DropdownMenu>
              ) : // 未ログイン時はrequiresAuthがtrueの項目を押すと警告ダイアログを表示
              item.requiresAuth && !isLoading() && !username() ? (
                <Button
                  type="button"
                  class="flex flex-col items-center gap-1 rounded-md px-0 py-3 text-xs font-semibold text-disabled-text w-full"
                  onClick={() => setShowLoginDialog(true)}
                >
                  <span class="text-lg">{item.icon()}</span>
                  <span>{item.label}</span>
                </Button>
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
                  <AppMenuTrigger variant="navBar" label={item.label} icon={item.icon()} />
                  <DropdownMenu.Portal>
                    <AppMenuContent class="absolute bottom-full left-1/2 mb-2 -translate-x-1/2">
                      <For each={item.dropdown}>
                        {(dropdownItem) => renderDropdownItem(dropdownItem)}
                      </For>
                    </AppMenuContent>
                  </DropdownMenu.Portal>
                </DropdownMenu>
              ) : // 未ログイン時はrequiresAuthがtrueの項目を押すと警告ダイアログを表示
              item.requiresAuth && !isLoading() && !username() ? (
                <Button
                  type="button"
                  class="flex-1 flex flex-col items-center gap-1 rounded-md px-0 py-2 text-xs font-semibold text-disabled-text justify-center"
                  onClick={() => setShowLoginDialog(true)}
                >
                  <span class="text-lg">{item.icon()}</span>
                  <span>{item.label}</span>
                </Button>
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
        <Dialog open={showLoginDialog()} onOpenChange={setShowLoginDialog} preventScroll={false}>
          <Dialog.Portal>
            <Dialog.Overlay class="fixed inset-0 bg-overlay z-50" />
            <Dialog.Content class="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg flex flex-col items-center">
              <Dialog.Title class="text-lg font-bold mb-2">ログインが必要です</Dialog.Title>
              <Dialog.Description class="mb-4 text-sm text-text-muted">
                この機能を利用するにはログインが必要です。
              </Dialog.Description>
              <div class="flex gap-4 mt-2">
                <AppButton onClick={() => setShowLoginDialog(false)}>戻る</AppButton>
                <AppButton
                  variant="primary"
                  onClick={() => {
                    setShowLoginDialog(false)
                    navigate('/login')
                  }}
                >
                  ログイン画面へ
                </AppButton>
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
                <AppButton onClick={() => setShowLogoutDialog(false)}>キャンセル</AppButton>
                <AppButton variant="danger" onClick={handleLogout}>
                  ログアウト
                </AppButton>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog>

        <Dialog open={showThemeDialog()} onOpenChange={setShowThemeDialog} preventScroll={false}>
          <Dialog.Portal>
            <Dialog.Overlay class="fixed inset-0 bg-overlay z-50" />
            <Dialog.Content class="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg">
              <Dialog.Title class="text-lg font-bold text-text">表示テーマ</Dialog.Title>
              <Dialog.Description class="mt-2 text-sm text-text-muted">
                {APPEARANCE_SETTINGS_COPY.dialogDescription}
              </Dialog.Description>
              <div class="mt-4">
                <AppearanceSettings />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </div>
    </div>
  )
}

export default NavBar

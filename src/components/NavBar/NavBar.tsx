import { AlertDialog } from '@kobalte/core/alert-dialog'
import { Dialog } from '@kobalte/core/dialog'
import { DropdownMenu } from '@kobalte/core/dropdown-menu'
import { A, useLocation, useNavigate } from '@solidjs/router'
import {
  BadgeQuestionMark,
  ChartNoAxesCombined,
  Ellipsis,
  House,
  ListMusic,
  LogOut,
  Music,
  Settings,
  Toolbox,
} from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createSignal, onMount } from 'solid-js'

type NavBarProps = {
  children: JSX.Element
}

import { postLogout } from '../../api/auth'
import { fetchMe } from '../../api/users'

type DropdownItem = {
  label: string
  icon: () => JSX.Element
  path: string
}

type NavItem = {
  label: string
  path: string
  icon: () => JSX.Element
  matchPattern?: RegExp
  matchPrefix?: boolean
  dropdown?: DropdownItem[]
  requiresAuth?: boolean
}

const NavBar = (props: NavBarProps) => {
  const [username, setUsername] = createSignal<string | null>(null)
  const [isLoading, setIsLoading] = createSignal(true)
  const [showLoginDialog, setShowLoginDialog] = createSignal(false)
  const [showLogoutDialog, setShowLogoutDialog] = createSignal(false)

  const location = useLocation()
  const navigate = useNavigate()

  // ナビゲーション項目の定義
  const getNavItems = (): NavItem[] => {
    const uname = username()
    const userPath = uname ? `/users/${encodeURIComponent(uname)}` : '/users/:username'
    const dropdownBase = [
      {
        label: '楽曲データベース',
        icon: () => <Music class="inline h-4 w-4 mr-1" aria-hidden="true" />,
        path: '/songs',
      },
      // 設定・ログアウトはログイン時のみ
      ...(uname
        ? [
          {
            label: '設定',
            icon: () => <Settings class="inline h-4 w-4 mr-1" aria-hidden="true" />,
            path: '/settings',
          },
        ]
        : []),
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
        label: 'ホーム',
        path: userPath,
        icon: () => <House class="h-6 w-6" aria-hidden="true" />,
        matchPattern: /^\/users\/[^/]+$/,
        requiresAuth: true,
      },
      {
        label: 'レコード',
        path: `${userPath}/records`,
        icon: () => <ListMusic class="h-6 w-6" aria-hidden="true" />,
        matchPattern: /^\/users\/[^/]+\/records/,
        requiresAuth: true,
      },
      {
        label: '統計',
        path: `${userPath}/stats`,
        icon: () => <ChartNoAxesCombined class="h-6 w-6" aria-hidden="true" />,
        matchPattern: /^\/users\/[^/]+\/stats/,
        requiresAuth: true,
      },
      {
        label: 'ツール',
        path: '/tools',
        icon: () => <Toolbox class="h-6 w-6" aria-hidden="true" />,
        matchPrefix: true,
      },
      {
        label: 'その他',
        path: '#',
        matchPattern: /a^/, // マッチしないダミーパターン
        icon: () => <Ellipsis class="h-6 w-6" aria-hidden="true" />,
        dropdown: dropdownBase,
      },
    ]
  }

  // コンポーネントマウント時にユーザー情報を取得
  onMount(async () => {
    setIsLoading(true)
    try {
      const user = await fetchMe()
      setUsername(user.username)
    } catch {
      setUsername(null)
    } finally {
      setIsLoading(false)
    }
  })

  const isActive = (item: NavItem) => {
    if (item.matchPattern) {
      return item.matchPattern.test(location.pathname)
    }
    if (item.matchPrefix) {
      return location.pathname.startsWith(item.path)
    }
    return location.pathname === item.path
  }

  const handleDropdownSelect = (path: string) => {
    if (path.startsWith('http')) {
      window.open(path, '_blank', 'noopener,noreferrer')
    } else {
      navigate(path)
    }
  }

  return (
    <div class="min-h-screen min-h-svh flex md:flex-row flex-col">
      {/* PC用nav-bar 768px以上 */}
      {/* TODO: lg以上では段階的にサイドナビゲーションバーの大きさを変化させる */}
      <aside class="hidden md:flex md:w-24 md:flex-col md:border-r md:border-gray-200 md:bg-white">
        <nav class="flex flex-1 flex-col px-2 py-6">
          {getNavItems().map((item) =>
            item.dropdown ? (
              <DropdownMenu>
                <DropdownMenu.Trigger class="flex flex-col items-center gap-1 w-full rounded-md px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none">
                  <span class="text-lg">{item.icon()}</span>
                  <span>{item.label}</span>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content class="absolute left-16 -top-12 ml-2 min-w-45 rounded-lg border border-gray-200 bg-white shadow-sm py-2 z-50">
                    {item.dropdown?.map((d) =>
                      // ログアウト項目は赤色で表示
                      d.label === 'ログアウト' ? (
                        <DropdownMenu.Item
                          onSelect={() => setShowLogoutDialog(true)}
                          class="block px-4 py-2 text-sm text-red-600 hover:bg-red-100 focus:bg-red-100 outline-none cursor-pointer"
                        >
                          <span class="pr-2">{d.icon()}</span>
                          {d.label}
                        </DropdownMenu.Item>
                      ) : (
                        <DropdownMenu.Item
                          onSelect={() => handleDropdownSelect(d.path)}
                          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 outline-none cursor-pointer"
                        >
                          <span class="pr-2">{d.icon()}</span>
                          {d.label}
                        </DropdownMenu.Item>
                      )
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu>
            ) : // 未ログイン時はrequiresAuthがtrueの項目を押すと警告ダイアログを表示
              item.requiresAuth && !isLoading() && username() === null ? (
                <button
                  type="button"
                  class="flex flex-col items-center gap-1 rounded-md px-0 py-3 text-xs font-semibold text-gray-300 w-full"
                  onClick={() => setShowLoginDialog(true)}
                >
                  <span class="text-lg">{item.icon()}</span>
                  <span>{item.label}</span>
                </button>
              ) : (
                <A
                  href={item.path}
                  class="flex flex-col items-center gap-1 rounded-md px-0 py-3 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  classList={{
                    'bg-gray-100 text-gray-900': isActive(item),
                  }}
                >
                  <span class="text-lg">{item.icon()}</span>
                  <span>{item.label}</span>
                </A>
              )
          )}
        </nav>
      </aside>

      <div class="flex flex-col min-h-0 h-full md:flex-1">
        <main class="flex-1 overflow-y-auto pb-4 md:pb-0">{props.children}</main>

        {/* スマホ用nav-bar 768px未満 */}
        <nav class="md:hidden shrink-0 flex items-center justify-between border-t border-gray-200 bg-white p-3 shadow-sm">
          {getNavItems().map((item) =>
            item.dropdown ? (
              <DropdownMenu>
                <DropdownMenu.Trigger class="flex-1 flex flex-col items-center gap-1 rounded-md px-0 py-3 text-xs font-semibold text-gray-500 justify-center">
                  <span class="text-lg">{item.icon()}</span>
                  <span>{item.label}</span>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 min-w-45 rounded-lg border border-gray-200 bg-white shadow-sm py-2 z-50">
                    {item.dropdown?.map((d) =>
                      // ログアウト項目は赤色で表示
                      d.label === 'ログアウト' ? (
                        <DropdownMenu.Item
                          onSelect={() => setShowLogoutDialog(true)}
                          class="block px-4 py-2 text-sm text-red-600 hover:bg-red-100 focus:bg-red-100 outline-none cursor-pointer font-semibold"
                        >
                          <span class="pr-2">{d.icon()}</span>
                          {d.label}
                        </DropdownMenu.Item>
                      ) : (
                        <DropdownMenu.Item
                          onSelect={() => handleDropdownSelect(d.path)}
                          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 outline-none cursor-pointer"
                        >
                          <span class="pr-2">{d.icon()}</span>
                          {d.label}
                        </DropdownMenu.Item>
                      )
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu>
            ) : // 未ログイン時はrequiresAuthがtrueの項目を押すと警告ダイアログを表示
              item.requiresAuth && !isLoading() && username() === null ? (
                <button
                  type="button"
                  class="flex-1 flex flex-col items-center gap-1 rounded-md px-0 py-3 text-xs font-semibold text-gray-300 justify-center"
                  onClick={() => setShowLoginDialog(true)}
                >
                  <span class="text-lg">{item.icon()}</span>
                  <span>{item.label}</span>
                </button>
              ) : (
                <A
                  href={item.path}
                  class="flex-1 flex flex-col items-center gap-1 rounded-md px-0 py-3 text-xs font-semibold text-gray-500 justify-center"
                  classList={{
                    'bg-gray-100 text-gray-900': isActive(item),
                  }}
                >
                  <span class="text-lg">{item.icon()}</span>
                  <span>{item.label}</span>
                </A>
              )
          )}
        </nav>

        {/* 未ログイン警告ダイアログ */}
        <Dialog open={showLoginDialog()} onOpenChange={setShowLoginDialog}>
          <Dialog.Portal>
            <Dialog.Overlay class="fixed inset-0 bg-black/30 z-50" />
            <Dialog.Content class="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg flex flex-col items-center">
              <Dialog.Title class="text-lg font-bold mb-2">ログインが必要です</Dialog.Title>
              <Dialog.Description class="mb-4 text-sm text-gray-700">
                この機能を利用するにはログインが必要です。
              </Dialog.Description>
              <div class="flex gap-4 mt-2">
                <button
                  type="button"
                  class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => setShowLoginDialog(false)}
                >
                  戻る
                </button>
                <button
                  type="button"
                  class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
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
            <AlertDialog.Overlay class="fixed inset-0 bg-black/30 z-50" />
            <AlertDialog.Content class="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg flex flex-col items-center">
              <AlertDialog.Title class="text-lg font-bold mb-2">
                ログアウトしますか？
              </AlertDialog.Title>
              <AlertDialog.Description class="mb-4 text-sm text-gray-700">
                本当にログアウトしますか？
              </AlertDialog.Description>
              <div class="flex gap-4 mt-2">
                <button
                  type="button"
                  class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => setShowLogoutDialog(false)}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                  onClick={async () => {
                    await postLogout()
                    setUsername(null)
                    setShowLogoutDialog(false)
                    navigate('/login')
                  }}
                >
                  ログアウト
                </button>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog>
      </div>
    </div>
  )
}

export default NavBar

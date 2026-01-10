import type { JSX } from "solid-js";
import { createSignal, Show, onCleanup, createEffect } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { DropdownMenu } from "@kobalte/core/dropdown-menu";
import {
    House,
    Music,
    Toolbox,
    Ellipsis,
    UsersRound,
    ListMusic,
    Settings,
    BadgeQuestionMark,
    ChartNoAxesCombined,
} from "lucide-solid";

type AppShellProps = {
    children: JSX.Element;
};

type DropdownItem = {
    label: string;
    icon: () => JSX.Element;
    path: string;
};

type NavItem = {
    label: string;
    path: string;
    icon: () => JSX.Element;
    matchPattern?: RegExp;
    matchPrefix?: boolean;
    dropdown?: DropdownItem[];
};

// TODO: ":username"を GET /internal/me から取得したユーザー名で置換する
const navItems: NavItem[] = [
    {
        label: "ホーム",
        path: "/users/:username",
        icon: () => <House class="h-6 w-6" aria-hidden="true" />,
        matchPattern: /^\/users\/[^/]+$/,
    },
    {
        label: "レコード",
        path: "/users/:username/records",
        icon: () => <ListMusic class="h-6 w-6" aria-hidden="true" />,
        matchPattern: /^\/users\/[^/]+\/records/,
    },
    {
        label: "統計",
        path: "/users/:username/stats",
        icon: () => <ChartNoAxesCombined class="h-6 w-6" aria-hidden="true" />,
        matchPattern: /^\/users\/[^/]+\/stats/,
    },
    {
        label: "ツール",
        path: "/tools",
        icon: () => <Toolbox class="h-6 w-6" aria-hidden="true" />,
        matchPrefix: true,
    },
    {
        label: "その他",
        path: "#",
        matchPattern: /a^/, // マッチしないダミーパターン
        icon: () => <Ellipsis class="h-6 w-6" aria-hidden="true" />,
        dropdown: [
            {
                label: "ユーザー一覧",
                icon: () => <UsersRound class="inline h-4 w-4 mr-1" aria-hidden="true" />,
                path: "/users"
            },
            {
                label: "楽曲データベース",
                icon: () => <Music class="inline h-4 w-4 mr-1" aria-hidden="true" />,
                path: "/songs"
            },
            {
                label: "設定",
                icon: () => <Settings class="inline h-4 w-4 mr-1" aria-hidden="true" />,
                path: "/settings"
            },
            {
                label: "ヘルプ",
                icon: () => <BadgeQuestionMark class="inline h-4 w-4 mr-1" aria-hidden="true" />,
                path: "https://example.com"
            },
        ],
    },
];


const AppShell = (props: AppShellProps) => {
    const location = useLocation();

    const isActive = (item: NavItem) => {
        if (item.matchPattern) {
            return item.matchPattern.test(location.pathname);
        }
        if (item.matchPrefix) {
            return location.pathname.startsWith(item.path);
        }
        return location.pathname === item.path;
    };

    return (
        <div class="h-dvh flex md:flex-row flex-col">
            {/* PC用nav-bar 768px以上 */}
            {/* TODO: lg以上では段階的にサイドナビゲーションバーの大きさを変化させる */}
            <aside class="hidden md:flex md:w-24 md:flex-col md:border-r md:border-slate-200 md:bg-white">
                <nav class="flex flex-1 flex-col px-2 py-6">
                    {navItems.map((item) =>
                        item.dropdown ? (
                            <DropdownMenu>
                                <DropdownMenu.Trigger class="flex flex-col items-center gap-1 w-full rounded-md px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none">
                                    <span class="text-lg">{item.icon()}</span>
                                    <span>{item.label}</span>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Portal>
                                    <DropdownMenu.Content class="absolute left-16 -top-12 ml-2 min-w-[180px] rounded-lg border border-slate-200 bg-white shadow-sm py-2 z-50">
                                        {item.dropdown?.map((d) =>
                                            d.path.startsWith("http") ? (
                                                <DropdownMenu.Item as="a" href={d.path} target="_blank" rel="noopener noreferrer"
                                                    class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 focus:bg-slate-100 outline-none"
                                                >
                                                    <span class="pr-2">{d.icon()}</span>{d.label}
                                                </DropdownMenu.Item>
                                            ) : (
                                                <DropdownMenu.Item as={A} href={d.path}
                                                    class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 focus:bg-slate-100 outline-none"
                                                >
                                                    <span class="pr-2">{d.icon()}</span>{d.label}
                                                </DropdownMenu.Item>
                                            )
                                        )}
                                    </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                            </DropdownMenu>
                        ) : (
                            <A
                                href={item.path}
                                class="flex flex-col items-center gap-1 rounded-md px-0 py-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                classList={{
                                    "bg-slate-100 text-slate-900": isActive(item),
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
                <main class="flex-1 overflow-y-auto pb-4 md:pb-0">
                    {props.children}
                </main>

                {/* スマホ用nav-bar 768px未満 */}
                <nav class="md:hidden flex-shrink-0 flex items-center justify-between border-t border-slate-200 bg-white p-3 shadow-sm">
                    {navItems.map((item) =>
                        item.dropdown ? (
                            <div class="flex-1 flex justify-center">
                                <DropdownNavItem item={item} />
                            </div>
                        ) : (
                            <A
                                href={item.path}
                                class="flex-1 flex flex-col items-center gap-1 rounded-md px-0 py-3 text-xs font-semibold text-slate-500 justify-center"
                                classList={{
                                    "bg-slate-100 text-slate-900": isActive(item),
                                }}
                            >
                                <span class="text-lg">{item.icon()}</span>
                                <span>{item.label}</span>
                            </A>
                        )
                    )}
                </nav>
            </div>
        </div>
    );
};

const DropdownNavItem = (props: { item: NavItem }) => {
    const [open, setOpen] = createSignal(false);
    let containerRef: HTMLDivElement | undefined;

    createEffect(() => {
        if (!open()) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef && !containerRef.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        onCleanup(() => {
            document.removeEventListener("mousedown", handleClickOutside);
        });
    });

    return (
        <div class="relative" ref={containerRef}>
            <button
                type="button"
                class="flex flex-col items-center gap-1 text-xs font-semibold text-slate-500 focus:outline-none"
                onClick={() => setOpen((v) => !v)}
            >
                <span class="text-lg">{props.item.icon()}</span>
                <span>{props.item.label}</span>
            </button>
            <Show when={open()}>
                <div
                    id="dropdown-menu"
                    class="absolute bottom-14 left-0 -translate-x-2/3 z-20 min-w-[180px] rounded-lg border border-slate-200 bg-white shadow-sm py-2"
                >
                    {props.item.dropdown?.map((d) => (
                        <A
                            href={d.path}
                            class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            onClick={() => setOpen(false)}
                        >
                            <span class="pr-2">{d.icon()}</span>{d.label}
                        </A>
                    ))}
                </div>
            </Show>
        </div>
    );
};

export default AppShell;

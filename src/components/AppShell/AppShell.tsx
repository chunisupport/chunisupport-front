import type { JSX } from "solid-js";
import { createSignal, Show, onCleanup } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { House, Music, Toolbox, Ellipsis } from "lucide-solid";

type AppShellProps = {
    children: JSX.Element;
};

type DropdownItem = {
    label: string;
    path: string;
};

type NavItem = {
    label: string;
    path: string;
    icon: JSX.Element;
    matchPattern?: RegExp;
    matchPrefix?: boolean;
    dropdown?: DropdownItem[];
};

// TODO: usernameの部分を動的に扱う
const navItems: NavItem[] = [
    {
        label: "ホーム",
        path: "/users/:username",
        icon: <House class="h-6 w-6" aria-hidden="true" />,
        matchPattern: /^\/users\/[^/]+$/,
    },
    {
        label: "レコード",
        path: "/users/:username/records",
        icon: <Music class="h-6 w-6" aria-hidden="true" />,
        matchPattern: /^\/users\/[^/]+\/records/,
    },
    {
        label: "ツール",
        path: "/tools",
        icon: <Toolbox class="h-6 w-6" aria-hidden="true" />,
        matchPrefix: true,
    },
    {
        label: "その他",
        path: "#",
        icon: <Ellipsis class="h-6 w-6" aria-hidden="true" />,
        dropdown: [
            { label: "ユーザー一覧", path: "/users" },
            { label: "楽曲データベース", path: "/songs" },
            { label: "設定", path: "/settings" },
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
        <div class="min-h-screen md:flex">
            {/* PC用nav-bar 768px以上 */}
            {/* <aside class="hidden md:flex md:w-64 md:flex-col md:border-r md:border-slate-200 md:bg-white">
                    まだ作ってないよ〜
            </aside> */}

            <main class="flex-1 pb-24 md:pb-0">
                {props.children}
            </main>

            {/* スマホ用nav-bar 768px未満 */}
            <nav class="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-around border-t border-slate-200 bg-white px-3 py-5 shadow-sm md:hidden">
                {navItems.map((item) =>
                    item.dropdown ? (
                        <DropdownNavItem item={item} />
                    ) : (
                        <A
                            href={item.path}
                            class="flex flex-col items-center gap-1 text-xs font-semibold text-slate-500"
                            classList={{
                                "text-slate-900 underline": isActive(item),
                            }}
                        >
                            <span class="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                        </A>
                    )
                )}
            </nav>
        </div>
    );
};

const DropdownNavItem = (props: { item: NavItem }) => {
    const [open, setOpen] = createSignal(true);

    // メニュー外クリックで閉じる
    const handleClickOutside = (e: MouseEvent) => {
        const menu = document.getElementById("dropdown-menu");
        if (open() && menu && !menu.contains(e.target as Node)) {
            setOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    onCleanup(() => document.removeEventListener("mousedown", handleClickOutside));

    return (
        <div class="relative">
            <button
                type="button"
                class="flex flex-col items-center gap-1 text-xs font-semibold text-slate-500 focus:outline-none"
                onClick={() => setOpen((v) => !v)}
            >
                <span class="text-lg">{props.item.icon}</span>
                <span>{props.item.label}</span>
            </button>
            <Show when={open()}>
                <div
                    id="dropdown-menu"
                    class="absolute bottom-17 left-1/2 -translate-x-2/3 z-20 min-w-[200px] rounded-lg border border-slate-200 bg-white shadow-sm py-2"
                >
                    {props.item.dropdown?.map((d) => (
                        <A
                            href={d.path}
                            class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            onClick={() => setOpen(false)}
                        >
                            {d.label}
                        </A>
                    ))}
                </div>
            </Show>
        </div>
    );
};

export default AppShell;

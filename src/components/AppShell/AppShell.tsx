import type { JSX } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { House, Music, Toolbox, Ellipsis } from "lucide-solid";

type AppShellProps = {
    children: JSX.Element;
};

type NavItem = {
    label: string;
    path: string;
    icon: JSX.Element;
    matchPrefix?: boolean;
};

const navItems: NavItem[] = [
    {
        label: "ホーム",
        path: "/users",
        icon: <House class="h-5 w-5" aria-hidden="true" />,
        matchPrefix: true,
    },
    {
        label: "レコード",
        path: "/users", // /users/*/records に変更
        icon: <Music class="h-5 w-5" aria-hidden="true" />,
        matchPrefix: true,
    },
    {
        label: "ツール",
        path: "/tools",
        icon: <Toolbox class="h-5 w-5" aria-hidden="true" />,
        matchPrefix: true,
    },
    {
        label: "その他",
        path: "a",
        icon: <Ellipsis class="h-5 w-5" aria-hidden="true" />,
        matchPrefix: true,
    },

];


const AppShell = (props: AppShellProps) => {
    const location = useLocation();

    const isActive = (item: NavItem) => {
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
            <nav class="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-around border-t border-slate-200 bg-white px-4 py-3 shadow-sm md:hidden">
                {navItems.map((item) => (
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
                ))}
            </nav>
        </div>
    );
};

export default AppShell;

import { DropdownMenu } from "@kobalte/core/dropdown-menu";
import { A, useLocation, useNavigate } from "@solidjs/router";
import {
	BadgeQuestionMark,
	ChartNoAxesCombined,
	Ellipsis,
	House,
	ListMusic,
	Music,
	Settings,
	Toolbox,
	UsersRound,
} from "lucide-solid";
import type { JSX } from "solid-js";
import { createSignal, onMount } from "solid-js";

type NavBarProps = {
	children: JSX.Element;
};

import { fetchMe } from "../../api/users";

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

const [username, setUsername] = createSignal<string | null>(null);

onMount(async () => {
	try {
		const user = await fetchMe();
		setUsername(user.username);
	} catch (error) {
		// 未認証やAPIエラー時はnullのまま
		console.error("Failed to fetch user info:", error);
	}
});

const getNavItems = (): NavItem[] => {
	const uname = username();
	const userPath = uname ? `/users/${uname}` : "/users/:username";
	return [
		{
			label: "ホーム",
			path: userPath,
			icon: () => <House class="h-6 w-6" aria-hidden="true" />,
			matchPattern: /^\/users\/[^/]+$/,
		},
		{
			label: "レコード",
			path: `${userPath}/records`,
			icon: () => <ListMusic class="h-6 w-6" aria-hidden="true" />,
			matchPattern: /^\/users\/[^/]+\/records/,
		},
		{
			label: "統計",
			path: `${userPath}/stats`,
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
					icon: () => (
						<UsersRound class="inline h-4 w-4 mr-1" aria-hidden="true" />
					),
					path: "/users",
				},
				{
					label: "楽曲データベース",
					icon: () => <Music class="inline h-4 w-4 mr-1" aria-hidden="true" />,
					path: "/songs",
				},
				{
					label: "設定",
					icon: () => (
						<Settings class="inline h-4 w-4 mr-1" aria-hidden="true" />
					),
					path: "/settings",
				},
				{
					label: "ヘルプ",
					icon: () => (
						<BadgeQuestionMark class="inline h-4 w-4 mr-1" aria-hidden="true" />
					),
					path: "https://example.com",
				},
			],
		},
	];
};

const NavBar = (props: NavBarProps) => {
	const location = useLocation();
	const navigate = useNavigate();

	const isActive = (item: NavItem) => {
		if (item.matchPattern) {
			return item.matchPattern.test(location.pathname);
		}
		if (item.matchPrefix) {
			return location.pathname.startsWith(item.path);
		}
		return location.pathname === item.path;
	};

	const handleDropdownSelect = (path: string) => {
		if (path.startsWith("http")) {
			window.open(path, "_blank", "noopener,noreferrer");
		} else {
			navigate(path);
		}
	};

	return (
		<div class="h-dvh flex md:flex-row flex-col">
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
										{item.dropdown?.map((d) => (
											<DropdownMenu.Item
												onSelect={() => handleDropdownSelect(d.path)}
												class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 outline-none cursor-pointer"
											>
												<span class="pr-2">{d.icon()}</span>
												{d.label}
											</DropdownMenu.Item>
										))}
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu>
						) : (
							<A
								href={item.path}
								class="flex flex-col items-center gap-1 rounded-md px-0 py-3 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900"
								classList={{
									"bg-gray-100 text-gray-900": isActive(item),
								}}
							>
								<span class="text-lg">{item.icon()}</span>
								<span>{item.label}</span>
							</A>
						),
					)}
				</nav>
			</aside>

			<div class="flex flex-col min-h-0 h-full md:flex-1">
				<main class="flex-1 overflow-y-auto pb-4 md:pb-0">
					{props.children}
				</main>

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
										{item.dropdown?.map((d) => (
											<DropdownMenu.Item
												onSelect={() => handleDropdownSelect(d.path)}
												class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 outline-none cursor-pointer"
											>
												<span class="pr-2">{d.icon()}</span>
												{d.label}
											</DropdownMenu.Item>
										))}
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu>
						) : (
							<A
								href={item.path}
								class="flex-1 flex flex-col items-center gap-1 rounded-md px-0 py-3 text-xs font-semibold text-gray-500 justify-center"
								classList={{
									"bg-gray-100 text-gray-900": isActive(item),
								}}
							>
								<span class="text-lg">{item.icon()}</span>
								<span>{item.label}</span>
							</A>
						),
					)}
				</nav>
			</div>
		</div>
	);
};

export default NavBar;

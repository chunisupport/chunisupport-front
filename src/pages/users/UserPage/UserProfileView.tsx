import * as Tabs from "@kobalte/core/tabs";
import { Image } from "lucide-solid";
import type { Component } from "solid-js";
import { For } from "solid-js";
import { ScrollToTop } from "../../../components";
import { UserNameplate } from "./components/UserNameplate";
import { UserRecordCard } from "./components/UserRecordCard";
import type {
	HonorDTO,
	PlayerDTO,
	PlayerRecordDTO,
	UserProfileWithRecordsDTO,
} from "../../../types/api";

type Props = {
	profile: UserProfileWithRecordsDTO;
};

export const UserProfileView: Component<Props> = (props) => {
	const { profile } = props;
	const playerInfo: PlayerDTO = profile.player;
	const honors: HonorDTO[] = playerInfo.honors;

	const bestRecords: PlayerRecordDTO[] = profile.records.best;
	const newRecords: PlayerRecordDTO[] = profile.records.new;

	// ネームプレートの高さ+マージン(タブ切り替え時の自動スクロール用)
	const NAMEPLATE_SCROLL_OFFSET = 183;

	return (
		// 2カラムレイアウト(PCのみ)
		<div class="md:flex md:gap-0 md:divide-x-4 md:divide-gray-300 md:h-screen">
			{/* 左側 */}
			<div class="py-4 md:min-w-106.25 md:shrink-0 md:h-full md:overflow-y-auto">
				{/* ネームプレート */}
				<UserNameplate
					playerInfo={playerInfo}
					honors={honors}
					bestRecords={bestRecords}
					newRecords={newRecords}
				/>

				<Tabs.Root
					class="mb-4"
					// タブを切り替えた際に1曲目の位置までスクロールする
					onChange={() => {
						const main = document.querySelector("main");
						if (main && main.scrollTop > NAMEPLATE_SCROLL_OFFSET) {
							main.scrollTo({
								top: NAMEPLATE_SCROLL_OFFSET,
								behavior: "smooth",
							});
						}
					}}
				>
					<Tabs.List class="sticky top-0 z-10 bg-white flex gap-2 mb-4 px-4 pt-2 border-b border-gray-300">
						<Tabs.Trigger
							value="best"
							class="px-3 py-1 rounded-t data-selected:bg-white data-selected:border-b-2 data-selected:border-blue-500"
						>
							ベスト枠
						</Tabs.Trigger>
						<Tabs.Trigger
							value="new"
							class="px-3 py-1 rounded-t data-selected:bg-white data-selected:border-b-2 data-selected:border-blue-500"
						>
							新曲枠
						</Tabs.Trigger>
						<div class="flex-1"></div>
						<button
							type="button"
							class="px-3 py-1 mb-1 bg-blue-500 text-white rounded-md"
						>
							<Image class="inline-block mr-1 mb-0.5" size={16} />
							画像化
						</button>
					</Tabs.List>
					<Tabs.Content value="best">
						<div class="mx-4">
							<For each={bestRecords}>
								{(record, i) => (
									<UserRecordCard record={record} index={i()} />
								)}
							</For>
						</div>
					</Tabs.Content>
					<Tabs.Content value="new">
						<div class="mx-4">
							<For each={newRecords}>
								{(record, i) => (
									<UserRecordCard record={record} index={i()} />
								)}
							</For>
						</div>
					</Tabs.Content>
				</Tabs.Root>

				{/* スクロールトップボタン（モバイル用） */}
				<div class="md:hidden">
					<ScrollToTop />
				</div>
			</div>
			{/* 右側 */}
			<div class="hidden md:block md:flex-1 md:h-screen md:overflow-y-auto"></div>
		</div>
	);
};

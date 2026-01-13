import * as Tabs from "@kobalte/core/tabs";
import { Image } from "lucide-solid";
import type { Component } from "solid-js";
import { ScrollToTop } from "../../../components";
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

	const sumRating = (records: PlayerRecordDTO[]): number => {
		return records.reduce((sum, record) => sum + record.rating, 0);
	};

	const bestRating = sumRating(bestRecords) / bestRecords.length;
	const newRating = sumRating(newRecords) / newRecords.length;
	const playerRating =
		(sumRating(bestRecords) + sumRating(newRecords)) /
		(bestRecords.length + newRecords.length);

	const getDifficultyColors = (difficulty: string) => {
		switch (difficulty) {
			case "BASIC":
				return "border-green-500 bg-green-200";
			case "ADVANCED":
				return "border-orange-500 bg-orange-200";
			case "EXPERT":
				return "border-red-500 bg-red-200";
			case "ULTIMA":
				return "border-red-500 bg-black text-white";
			case "MASTER":
				return "border-purple-500 bg-purple-200";
			default:
				return "border-gray-500 bg-gray-200";
		}
	};

	return (
		// 2カラムレイアウト(PCのみ)
		<div class="md:flex md:gap-0 md:divide-x-4 md:divide-gray-300 md:h-screen">

			{/* 左側 */}
			<div class="py-4 md:min-w-106.25 md:shrink-0 md:h-full md:overflow-y-auto">
				{/* ネームプレート */}
				<div class="mb-2 mx-4 px-3 py-3 border border-gray-200 shadow-sm rounded-md ">
					{/* TODO: 称号の背景画像を表示 */}
					<p class="mb-3 p-1 bg-yellow-200 rounded-md text-sm text-center">
						{honors[0].name}
					</p>
					<div class="mb-2 flex flex-row items-end justify-between">
						<p class="">Lv. {playerInfo.level}</p>
						<h1 class="flex-1 text-xl font-medium text-center">
							{playerInfo.name}
						</h1>
					</div>
					<hr class="mb-2 border-t border-gray-200" />
					<p>
						Rating {playerRating.toFixed(4)}{" "}
						<span class="text-gray-500">
							(Best {bestRating.toFixed(4)} / New {newRating.toFixed(4)})
						</span>
					</p>
					{/* TODO: OverPowerのゲージみたいなのあるといいよね */}
					<p>OP {playerInfo.overpower_percent}%</p>
				</div>

				<Tabs.Root
					class="mb-4"
					// タブを切り替えた際に1曲目の位置までスクロールする
					onChange={() => {
						const main = document.querySelector("#root > div > div > main");
						if (main && main.scrollTop > 183) {
							main.scrollTo({ top: 183, behavior: "smooth" });
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
							{bestRecords.map((record, i) => (
								<div
									class={`mb-2 p-3 rounded-md border ${getDifficultyColors(record.difficulty)}`}
								>
									<div class="flex gap-3">
										<div class="flex flex-col">
											<p># {i + 1}</p>
											<p class="text-sm">{record.rating.toFixed(2)}</p>
										</div>
										<div>
											<p class="font-medium">{record.title}</p>
											<p class="text-sm">
												{record.const} / {record.score}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					</Tabs.Content>
					<Tabs.Content value="new">
						<div class="mx-4">
							{newRecords.map((record, i) => (
								<div
									class={`mb-2 p-3 rounded-md border ${getDifficultyColors(record.difficulty)}`}
								>
									<div class="flex gap-3">
										<div class="flex flex-col">
											<p># {i + 1}</p>
											<p class="text-sm">{record.rating.toFixed(2)}</p>
										</div>
										<div>
											<p class="font-medium">{record.title}</p>
											<p class="text-sm">
												{record.const} / {record.score}
											</p>
										</div>
									</div>
								</div>
							))}
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

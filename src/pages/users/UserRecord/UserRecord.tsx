import { Collapsible } from "@kobalte/core/collapsible";
import { TextField } from "@kobalte/core/text-field";
import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { Funnel } from "lucide-solid";
import type { Component } from "solid-js";
import {
	createMemo,
	createResource,
	createSignal,
	ErrorBoundary,
	Suspense,
} from "solid-js";
import { fetchAllSongs } from "../../../api/songs";
import { fetchUserProfile } from "../../../api/users";
import { Loading } from "../../../components";
import type { PlayerRecordDTO } from "../../../types/api";
import {
	type MergedRecordDTO,
	mergeAllRecords,
} from "../../../utils/recordMerger";
import FilterDialog from "./components/FilterDialog";
import RecordTable from "./components/RecordTable";
import { DEFAULT_FILTER } from "./types/filterDefaults";
import type { ComboLamp, Difficulty, FilterState } from "./types/types";

// 統計表示用定数
const rankOrder = ["MAX", "SSS+", "SSS", "SS+", "SS", "S+", "S", "OTHERS"];
const rankColorMap: Record<string, string> = {
	MAX: "bg-red-300",
	"SSS+": "bg-lime-300",
	SSS: "bg-yellow-300",
	"SS+": "bg-amber-300",
	SS: "bg-orange-300",
	"S+": "bg-blue-300",
	S: "bg-cyan-300",
	OTHERS: "bg-gray-300",
};
const comboOrder = ["ALL JUSTICE", "FULL COMBO", "NONE"];
const comboColorMap: Record<string, string> = {
	"ALL JUSTICE": "bg-yellow-300",
	"FULL COMBO": "bg-orange-300",
	NONE: "bg-gray-300",
};
const clearOrder = [
	"CATASTROPHY",
	"ABSOLUTE",
	"BRAVE",
	"HARD",
	"CLEAR",
	"FAILED",
	"NONE",
];
const clearColorMap: Record<string, string> = {
	CATASTROPHY: "bg-red-300",
	ABSOLUTE: "bg-lime-300",
	BRAVE: "bg-yellow-300",
	HARD: "bg-amber-300",
	CLEAR: "bg-blue-300",
	FAILED: "bg-gray-300",
	NONE: "bg-gray-200",
};

// 分布バー描画ヘルパー
function renderDistributionBar(
	dist: Record<string, { count: number; percent: number }>,
	order: string[],
	colorMap: Record<string, string>,
) {
	return (
		<div class="flex w-full h-4 rounded overflow-hidden mb-1 divide-x divide-gray-100">
			{order
				.filter((key) => dist[key])
				.map((key) => {
					const { percent } = dist[key];
					return (
						<div
							class={`${colorMap[key]} h-full`}
							style={{ width: `${percent}%` }}
							title={key}
						></div>
					);
				})}
		</div>
	);
}

const UserRecord: Component = () => {
	const params = useParams<{ username: string }>();
	const [userProfile] = createResource(() => params.username, fetchUserProfile);
	const [allSongs] = createResource(fetchAllSongs);

	// フィルター状態
	const [filters, setFilters] = createSignal<FilterState>({
		...DEFAULT_FILTER,
	});
	// ダイアログ開閉
	const [filterOpen, setFilterOpen] = createSignal(false);

	// 楽曲＋プレイ済みマージ
	const mergedRecords = createMemo(() => {
		const profile = userProfile();
		const songs = allSongs();
		if (!profile || !songs) return [];
		return mergeAllRecords(songs.songs, profile.records.all);
	});

	// フィルター適用
	const filteredRecords = createMemo(() => {
		const records = mergedRecords();
		const f = filters();
		return records.filter((record) => {

			// 未プレイ除外
			if (f.excludeNoPlay && !record.is_played) {
				return false;
			}

			// 曲名
			if (
				f.title &&
				!record.title.toLowerCase().includes(f.title.toLowerCase())
			)
				return false;

			// 難易度
			if (!f.difficulties.includes(record.difficulty as Difficulty))
				return false;

			// 定数
			if (record.const < f.constMin) return false;
			if (record.const > f.constMax) return false;

			// スコア
			if (record.is_played && record.score !== null) {
				if (record.score < f.scoreMin) return false;
				if (record.score > f.scoreMax) return false;
			}

			// ランプ
			if (record.is_played) {
				const lamp = record.combo_lamp;
				if (!f.lamps.includes(lamp as ComboLamp)) return false;
			}

			return true;
		});
	});

	// 件数表示
	const totalCount = () => mergedRecords().length;
	const filteredCount = () => filteredRecords().length;

	// ランク分類関数
	function getRank(score: number): string {
		if (score === 1010000) return "MAX";
		if (score >= 1009000) return "SSS+";
		if (score >= 1007500) return "SSS";
		if (score >= 1005000) return "SS+";
		if (score >= 1000000) return "SS";
		if (score >= 990000) return "S+";
		if (score >= 975000) return "S";
		return "OTHERS";
	}

	/**
	 * 統計計算ヘルパー
	 * プレイ済み譜面のみ集計
	 */
	function getStats(records: PlayerRecordDTO[] | MergedRecordDTO[]) {
		const total = records.length;
		// ランク分布
		const rankMap: Record<string, { count: number; percent: number }> = {};
		// コンボ分布
		const comboMap: Record<string, { count: number; percent: number }> = {};
		// クリア分布
		const clearMap: Record<string, { count: number; percent: number }> = {};
		// スコア配列
		const scores = records
			.map((r) => r.score)
			.filter((v): v is number => v !== null && v !== undefined)
			.sort((a, b) => a - b);

		for (const r of records) {
			// ランク
			const rank = getRank(r.score ?? 0);
			rankMap[rank] = rankMap[rank] || { count: 0, percent: 0 };
			rankMap[rank].count++;
			// コンボ
			const combo = r.combo_lamp ?? "NONE";
			comboMap[combo] = comboMap[combo] || { count: 0, percent: 0 };
			comboMap[combo].count++;
			// クリア
			const clear = r.clear_lamp ?? "NONE";
			clearMap[clear] = clearMap[clear] || { count: 0, percent: 0 };
			clearMap[clear].count++;
		}
		// 割合計算
		Object.values(rankMap).forEach((obj) => {
			obj.percent = total ? (obj.count / total) * 100 : 0;
		});
		Object.values(comboMap).forEach((obj) => {
			obj.percent = total ? (obj.count / total) * 100 : 0;
		});
		Object.values(clearMap).forEach((obj) => {
			obj.percent = total ? (obj.count / total) * 100 : 0;
		});

		// スコア統計
		const min = scores[0] ?? 0;
		const max = scores[scores.length - 1] ?? 0;
		const avg = scores.length
			? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
			: 0;
		const median = scores.length
			? scores.length % 2 === 1
				? scores[(scores.length - 1) / 2]
				: Math.round(
						(scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2,
					)
			: 0;
		const q1 = scores.length
			? scores[Math.floor((scores.length - 1) * 0.25)]
			: 0;
		const q3 = scores.length
			? scores[Math.floor((scores.length - 1) * 0.75)]
			: 0;

		return {
			rankDist: rankMap,
			comboDist: comboMap,
			clearDist: clearMap,
			scoreStats: { min, max, avg, median, q1, q3 },
		};
	}

	/**
	 * 統計データ
	 * プレイ済み譜面のみ集計
	 */
	const stats = createMemo(() => {
		// is_playedかつscoreがあるもののみ
		const played = filteredRecords().filter(
			(r): r is MergedRecordDTO =>
				r.is_played && r.score !== null && typeof r.score === "number",
		);
		return getStats(played);
	});

	return (
		<>
			<Title>{params.username}さんのページ - Chunisupport</Title>
			<Suspense fallback={<Loading />}>
				<ErrorBoundary
					fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}
				>
					<div class="my-4 mx-2 text-sm">
						{/* 検索・フィルター */}
						<div class="flex items-center mb-2 gap-2">
							<TextField class="flex-1">
								<TextField.Input
									class="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500"
									placeholder="曲名で検索..."
									value={filters().title}
									onInput={(e) =>
										setFilters({ ...filters(), title: e.currentTarget.value })
									}
								/>
							</TextField>
							<button
								class="px-2 py-1 rounded border border-gray-500 flex items-center gap-2 hover:bg-gray-100"
								onClick={() => setFilterOpen(true)}
								type="button"
							>
								<Funnel class="text-gray-700" size={16} /> フィルター
							</button>
						</div>
						{/* フィルター統計 */}
						{filteredCount() > 0 && (
							<Collapsible class="mb-2 px-2 py-1 border border-gray-500 rounded-sm">
								<Collapsible.Trigger class="flex w-full gap-1 group">
									<span class="mr-1 group-data-expanded:rotate-90">▶</span>
									<p class="flex-1 text-left">フィルター統計</p>
									<p>平均スコア: {stats().scoreStats.avg.toLocaleString()}</p>
								</Collapsible.Trigger>

								<Collapsible.Content>
									<div class="text-xs space-y-2 py-2">
										<div>
											<b>ランク割合:</b>
											{renderDistributionBar(
												stats().rankDist,
												rankOrder,
												rankColorMap,
											)}
											<ul>
												{rankOrder
													.filter((rank) => stats().rankDist[rank])
													.map((rank) => {
														const { count, percent } = stats().rankDist[rank];
														return (
															<li>
																{rank}: {count}件 ({percent.toFixed(1)}%)
															</li>
														);
													})}
											</ul>
										</div>
										<div>
											<b>コンボランプ割合:</b>
											{renderDistributionBar(
												stats().comboDist,
												comboOrder,
												comboColorMap,
											)}
											<ul>
												{comboOrder
													.filter((lamp) => stats().comboDist[lamp])
													.map((lamp) => {
														const { count, percent } = stats().comboDist[lamp];
														return (
															<li>
																{lamp}: {count}件 ({percent.toFixed(1)}%)
															</li>
														);
													})}
											</ul>
										</div>
										<div>
											<b>クリアランプ割合:</b>
											{renderDistributionBar(
												stats().clearDist,
												clearOrder,
												clearColorMap,
											)}
											<ul>
												{clearOrder
													.filter((lamp) => stats().clearDist[lamp])
													.map((lamp) => {
														const { count, percent } = stats().clearDist[lamp];
														return (
															<li>
																{lamp}: {count}件 ({percent.toFixed(1)}%)
															</li>
														);
													})}
											</ul>
										</div>
										{stats().scoreStats.max !== stats().scoreStats.min ? (
											<div>
												<b>スコア分布:</b>
												<div class="relative w-full h-4 rounded mb-1">
													{(() => {
														const { min, q1, median, q3, max } =
															stats().scoreStats;
														const toPct = (v: number) =>
															((v - min) / (max - min)) * 100;
														const q1Pct = toPct(q1);
														const medianPct = toPct(median);
														const q3Pct = toPct(q3);
														return (
															<div class="absolute left-0 top-1/2 w-full h-full -translate-y-1/2 bg-gray-200 rounded">
																{/* 箱 */}
																<div
																	class="absolute h-full bg-blue-400 rounded"
																	style={{
																		left: `${q1Pct}%`,
																		width: `${q3Pct - q1Pct}%`,
																	}}
																></div>
																{/* 中央値 */}
																<div
																	class="absolute w-1 bg-blue-900 h-full rounded"
																	style={{
																		left: `${medianPct}%`,
																	}}
																></div>
															</div>
														);
													})()}
												</div>
												<ul>
													<li>
														最小: {stats().scoreStats.min.toLocaleString()}
													</li>
													<li>
														最大: {stats().scoreStats.max.toLocaleString()}
													</li>
													<li>
														平均: {stats().scoreStats.avg.toLocaleString()}
													</li>
													<li>
														第1四分位数:{" "}
														{stats().scoreStats.q1.toLocaleString()}
													</li>
													<li>
														中央値: {stats().scoreStats.median.toLocaleString()}
													</li>
													<li>
														第3四分位数:{" "}
														{stats().scoreStats.q3.toLocaleString()}
													</li>
												</ul>
											</div>
										) : null}
									</div>
								</Collapsible.Content>
							</Collapsible>
						)}
						{/* 仮の表示 */}
						<p class="mb-2 text-sm text-gray-600">
							全 {totalCount()} 件中 {filteredCount()} 件を表示
						</p>
						<RecordTable records={filteredRecords()} />
						<FilterDialog
							open={filterOpen()}
							onOpenChange={setFilterOpen}
							filters={filters()}
							onChange={setFilters}
						/>
					</div>
				</ErrorBoundary>
			</Suspense>
		</>
	);
};

export default UserRecord;

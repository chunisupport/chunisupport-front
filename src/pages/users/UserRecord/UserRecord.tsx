import { Collapsible } from "@kobalte/core/collapsible";
import { Progress } from "@kobalte/core/progress";
import { TextField } from "@kobalte/core/text-field";
import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { CircleX, Funnel } from "lucide-solid";
import type { Component } from "solid-js";
import {
	createEffect,
	createMemo,
	createResource,
	createSignal,
	ErrorBoundary,
	Suspense,
} from "solid-js";
import { fetchAllSongs, fetchMasterData } from "../../../api/songs";
import { fetchUserProfile } from "../../../api/users";
import { Loading } from "../../../components";
import type { MasterDataDTO, MasterItemDTO } from "../../../types/api";
import {
	mergeAllRecords,
	type PlayerRecordIncludeNoPlay,
} from "../../../utils/recordMerger";
import { CHUNITHM_VERSIONS } from "../../../utils/versionConverter";
import FilterDialog from "./components/FilterDialog";
import RecordTable from "./components/RecordTable";
import { DEFAULT_FILTER, LAMP_OPTIONS } from "./types/filterDefaults";
import type { ComboLamp, Difficulty, FilterState } from "./types/types";
import {
	clearTrackingCondition,
	loadSavedFilters,
	loadTrackingCondition,
	type TrackingCondition,
} from "./utils/storage";

// 統計表示用定数
const rankOrder = [
	"MAX",
	"SSS+",
	"SSS",
	"SS+",
	"SS",
	"S+",
	"S",
	"OTHERS",
	"未プレイ",
];
const rankColorMap: Record<string, string> = {
	MAX: "bg-red-300",
	"SSS+": "bg-lime-300",
	SSS: "bg-yellow-300",
	"SS+": "bg-amber-300",
	SS: "bg-orange-300",
	"S+": "bg-blue-300",
	S: "bg-cyan-300",
	OTHERS: "bg-gray-300",
	未プレイ: "bg-gray-200",
};
const comboOrder = ["ALL JUSTICE", "FULL COMBO", "なし", "未プレイ"];
const comboColorMap: Record<string, string> = {
	"ALL JUSTICE": "bg-yellow-300",
	"FULL COMBO": "bg-orange-300",
	なし: "bg-gray-300",
	未プレイ: "bg-gray-200",
};
const clearOrder = [
	"CATASTROPHY",
	"ABSOLUTE",
	"BRAVE",
	"HARD",
	"CLEAR",
	"FAILED",
	"未プレイ",
];
const clearColorMap: Record<string, string> = {
	CATASTROPHY: "bg-red-300",
	ABSOLUTE: "bg-lime-300",
	BRAVE: "bg-yellow-300",
	HARD: "bg-amber-300",
	CLEAR: "bg-blue-300",
	FAILED: "bg-gray-300",
	未プレイ: "bg-gray-200",
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

function getDefaultFilter(masterData?: MasterDataDTO): FilterState {
	return {
		...DEFAULT_FILTER,
		// ジャンル・バージョン全選択(上書き)
		genres: masterData?.genres?.map((g: MasterItemDTO) => g.name) ?? [],
		versions: [...CHUNITHM_VERSIONS],
		lamps: [...LAMP_OPTIONS],
	};
}

const UserRecord: Component = () => {
	const params = useParams<{ username: string }>();
	const [userProfile] = createResource(() => params.username, fetchUserProfile);
	const [allSongs] = createResource(fetchAllSongs);
	const [masterData] = createResource(fetchMasterData);

	// フィルター状態
	const [filters, setFilters] = createSignal<FilterState>({
		...DEFAULT_FILTER,
	});
	const [trackingCondition, setTrackingCondition] =
		createSignal<TrackingCondition | null>(loadTrackingCondition());

	// masterData取得後にgenres/versionsを全選択で初期化
	createEffect(() => {
		const md = masterData();
		if (!md) return;
		setFilters((prev) => ({
			...prev,
			genres: md.genres.map((g) => g.name),
			versions: [...CHUNITHM_VERSIONS],
		}));
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
	const isRecordMatched = (
		record: PlayerRecordIncludeNoPlay,
		f: FilterState,
	) => {
		// 未プレイ除外
		if (f.excludeNoPlay && !record.is_played) {
			return false;
		}

		// 曲名
		if (f.title && !record.title.toLowerCase().includes(f.title.toLowerCase()))
			return false;

		// 難易度
		if (!f.difficulties.includes(record.difficulty as Difficulty)) return false;

		// ジャンル
		if (f.genres.length > 0 && !f.genres.includes(record.genre)) return false;

		// バージョン
		if (f.versions.length > 0 && !f.versions.includes(record.release_version))
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
	};

	const filteredRecords = createMemo(() => {
		const records = mergedRecords();
		const f = filters();
		return records.filter((record) => isRecordMatched(record, f));
	});

	const trackingTargetFilter = createMemo(() => {
		const condition = trackingCondition();
		if (!condition) return null;
		const saved = loadSavedFilters();
		return saved.find((item) => item.id === condition.filterId) ?? null;
	});

	const trackingBaseRecords = createMemo(() => {
		const records = mergedRecords();
		const target = trackingTargetFilter();
		if (!target) return [];
		return records.filter((record) => isRecordMatched(record, target.filter));
	});

	const isRecordAchieved = (
		record: PlayerRecordIncludeNoPlay,
		condition: TrackingCondition,
	) => {
		const hasScore = typeof condition.scoreMin !== "undefined";
		const hasLamp = (condition.lamps ?? []).length > 0;
		if (!hasScore && !hasLamp) return false;
		if (!record.is_played) return false;

		if (hasScore) {
			const minScore = condition.scoreMin ?? 0;
			if (record.score === null) return false;
			if (record.score < minScore) return false;
		}

		if (hasLamp) {
			const lamp = record.combo_lamp ?? null;
			if (!condition.lamps?.includes(lamp as ComboLamp)) return false;
		}

		return true;
	};

	const trackingStats = createMemo(() => {
		const condition = trackingCondition();
		const baseRecords = trackingBaseRecords();
		if (!condition || baseRecords.length === 0) {
			return {
				achieved: 0,
				total: baseRecords.length,
				remaining: baseRecords.length,
				percent: 0,
			};
		}
		const achieved = baseRecords.filter((record) =>
			isRecordAchieved(record, condition),
		).length;
		const total = baseRecords.length;
		const percent = total ? (achieved / total) * 100 : 0;
		return {
			achieved,
			total,
			remaining: total - achieved,
			percent,
		};
	});

	const trackingGoalLabel = createMemo(() => {
		const condition = trackingCondition();
		if (!condition) return "";
		const parts: string[] = [];
		if (typeof condition.scoreMin !== "undefined") {
			parts.push(`${condition.scoreMin.toLocaleString()}点以上`);
		}
		if (condition.lamps) {
			const lamps = condition.lamps;
			if (lamps.includes("ALL JUSTICE") && lamps.includes("FULL COMBO")) {
				parts.push("FULL COMBO");
			} else if (lamps.includes("ALL JUSTICE")) {
				parts.push("ALL JUSTICE");
			}
		}
		return parts.join(" & ");
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

	// 統計計算関数
	function getStats(records: PlayerRecordIncludeNoPlay[]) {
		const total = records.length;
		// ランク分布
		const rankMap: Record<string, { count: number; percent: number }> = {};
		// コンボ分布
		const comboMap: Record<string, { count: number; percent: number }> = {};
		// クリア分布
		const clearMap: Record<string, { count: number; percent: number }> = {};
		// スコア配列（プレイ済みのみ）
		const scores = records
			.filter((r) => r.is_played && r.score !== null)
			.map((r) => r.score as number)
			.sort((a, b) => a - b);

		for (const r of records) {
			// ランク
			const rank =
				r.is_played && r.score !== null ? getRank(r.score) : "未プレイ";
			rankMap[rank] = rankMap[rank] || { count: 0, percent: 0 };
			rankMap[rank].count++;
			// コンボ
			const combo = r.is_played ? (r.combo_lamp ?? "なし") : "未プレイ";
			comboMap[combo] = comboMap[combo] || { count: 0, percent: 0 };
			comboMap[combo].count++;
			// クリア
			const clear = r.is_played ? (r.clear_lamp ?? "FAILED") : "未プレイ";
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

		// スコア統計（プレイ済みのみ）
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

	const stats = createMemo(() => {
		return getStats(filteredRecords());
	});

	return (
		<>
			<Title>{params.username}さんのページ - Chunisupport</Title>
			<Suspense fallback={<Loading />}>
				<ErrorBoundary
					fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}
				>
					<div class="my-4 mx-2 text-sm">
						{/* 追跡表示 */}
						{trackingCondition() && trackingTargetFilter() && (
							<div class="mb-2 p-2 border border-lime-600 rounded-sm text-lime-600">
								<div class="flex justify-between mb-1 items-center">
									<div class="flex items-center gap-2">
										<p class="text-base font-bold">追跡中の条件</p>
										<CircleX
											class="text-red-500 cursor-pointer hover:bg-lime-100"
											size={16}
											onClick={() => {
												clearTrackingCondition();
												setTrackingCondition(null);
											}}
										/>
									</div>
									<div class="flex items-center gap-2">
										<p>
											達成:{" "}
											<span class="text-base">{trackingStats().achieved}</span>
										</p>
									</div>
								</div>
								<div class="flex justify-between mb-2">
									<p class="">
										「{trackingTargetFilter()?.name}」 {trackingGoalLabel()}
									</p>
									<p class="">
										残り: {trackingStats().remaining}, 総数:{" "}
										{trackingStats().total}
									</p>
								</div>
								<Progress value={trackingStats().percent} class="w-full">
									<Progress.Track class="h-3 rounded bg-gray-200">
										<Progress.Fill class="h-full rounded w-(--kb-progress-fill-width) bg-lime-500" />
									</Progress.Track>
								</Progress>
							</div>
						)}
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
											<b>スコアランク割合:</b>
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
												<b>スコア分布(既プレイのみ):</b>
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
							masterData={masterData()}
							defaultFilter={getDefaultFilter(masterData())}
							onTrackingChange={() =>
								setTrackingCondition(loadTrackingCondition())
							}
						/>
					</div>
				</ErrorBoundary>
			</Suspense>
		</>
	);
};

export default UserRecord;

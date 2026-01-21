import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
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
import { Loading, ScrollToTop } from "../../../components";
import {
	mergeAllRecords,
	type PlayerRecordIncludeNoPlay,
} from "../../../utils/recordMerger";
import { CHUNITHM_VERSIONS } from "../../../utils/versionConverter";
import FilterDialog from "./components/FilterDialog";
import FilterStats from "./components/FilterStats";
import FilterToolbar from "./components/FilterToolbar";
import RecordTable from "./components/RecordTable";
import TrackingSummary from "./components/TrackingSummary";
import { DEFAULT_FILTER } from "./types/filterDefaults";
import type { ComboLamp, FilterState } from "./types/types";
import { getDefaultFilter, isRecordMatched } from "./utils/filtering";
import { getRecordStats } from "./utils/recordStats";
import {
	clearTrackingCondition,
	loadSavedFilters,
	loadTrackingCondition,
	type TrackingCondition,
} from "./utils/storage";

const UserRecord: Component = () => {
	const params = useParams<{ username: string }>();
	const [userProfile] = createResource(() => params.username, fetchUserProfile);
	const [allSongs] = createResource(fetchAllSongs);
	const [masterData] = createResource(fetchMasterData);

	// フィルター・追跡の状態
	const [filters, setFilters] = createSignal<FilterState>({
		...DEFAULT_FILTER,
	});
	const [trackingCondition, setTrackingCondition] =
		createSignal<TrackingCondition | null>(loadTrackingCondition());

	// フィルターダイアログの開閉状態
	const [filterOpen, setFilterOpen] = createSignal(false);

	// フィルターを初期化
	// マスタデータ取得後にgenres/versionsを全選択
	createEffect(() => {
		const md = masterData();
		if (!md) return;
		setFilters((prev) => ({
			...prev,
			genres: md.genres.map((g) => g.name),
			versions: [...CHUNITHM_VERSIONS],
		}));
	});

	/** 未プレイを含む全曲のレコード */
	const mergedRecords = createMemo(() => {
		const profile = userProfile();
		const songs = allSongs();
		const md = masterData();
		if (!profile || !songs || !md) return [];
		const difficulties = md.difficulties.map((d) => d.name);
		return mergeAllRecords(songs.songs, profile.records.all, difficulties);
	});

	/** フィルター適用後のレコード */
	const filteredRecords = createMemo(() => {
		const records = mergedRecords();
		const currentFilters = filters();
		return records.filter((record) => isRecordMatched(record, currentFilters));
	});

	/** 追跡中のフィルター情報 */
	const trackingTargetFilter = createMemo(() => {
		const condition = trackingCondition();
		if (!condition) return null;
		const saved = loadSavedFilters();
		return saved.find((item) => item.id === condition.filterId) ?? null;
	});

	/** 追跡中のフィルターに該当するレコード(未達成・達成済みすべて) */
	const trackingBaseRecords = createMemo(() => {
		const records = mergedRecords();
		const target = trackingTargetFilter();
		if (!target) return [];
		return records.filter((record) => isRecordMatched(record, target.filter));
	});

	/** 追跡の条件達成判定 */
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

	/** 追跡中の統計情報 */
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

	/** 追跡中の目標を読めるようにしたもの */
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

	/** レコード統計の集計結果 */
	const stats = createMemo(() => getRecordStats(filteredRecords()));

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
							<TrackingSummary
								condition={trackingCondition() as TrackingCondition}
								targetName={trackingTargetFilter()?.name ?? ""}
								goalLabel={trackingGoalLabel()}
								stats={trackingStats()}
								onClear={() => {
									clearTrackingCondition();
									setTrackingCondition(null);
								}}
							/>
						)}

						{/* フィルター関連UI */}
						<FilterToolbar
							title={filters().title}
							onTitleChange={(value) =>
								setFilters({ ...filters(), title: value })
							}
							onOpenFilter={() => setFilterOpen(true)}
						/>

						{/* フィルター統計 */}
						{filteredCount() > 0 && <FilterStats stats={stats()} />}

						<p class="mb-2 text-sm text-gray-600">
							全 {totalCount()} 件中 {filteredCount()} 件を表示
						</p>

						{/* レコード一覧 */}
						<RecordTable records={filteredRecords()} />

						{/* フィルターダイアログ */}
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
					<ScrollToTop />
				</ErrorBoundary>
			</Suspense>
		</>
	);
};

export default UserRecord;

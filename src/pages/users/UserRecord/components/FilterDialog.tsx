import { AlertDialog } from "@kobalte/core/alert-dialog";
import { Dialog } from "@kobalte/core/dialog";
import { RotateCcw } from "lucide-solid";
import type { Component } from "solid-js";
import { createEffect, createSignal } from "solid-js";
import type { MasterDataDTO } from "../../../../types/api";
import { CHUNITHM_VERSIONS } from "../../../../utils/versionConverter";
import { LAMP_OPTIONS } from "../types/filterDefaults";
import type { Difficulty, FilterState } from "../types/types";
import { parseNumberInput, toggleArray } from "../utils/filterDialog";
import { SCORE_RANK_VALUES } from "../utils/scoreRank";
import {
	clearTrackingCondition,
	deleteFilter,
	loadSavedFilters,
	loadTrackingCondition,
	type SavedFilter,
	saveNewFilter,
	saveTrackingCondition,
} from "../utils/storage";
import ConstRangeSection from "./filterDialog/ConstRangeSection";
import DifficultySection from "./filterDialog/DifficultySection";
import GenreSection from "./filterDialog/GenreSection";
import LampSection from "./filterDialog/LampSection";
import SaveDialog from "./filterDialog/SaveDialog";
import ScoreSection from "./filterDialog/ScoreSection";
import TrackingDialog from "./filterDialog/TrackingDialog";
import VersionSection from "./filterDialog/VersionSection";

interface FilterDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	filters: FilterState;
	onChange: (filters: FilterState) => void;
	masterData?: MasterDataDTO;
	defaultFilter: FilterState;
	onTrackingChange?: () => void;
}

export const FilterDialog: Component<FilterDialogProps> = (props) => {

	// 現在のフィルター状態
	const [filters, setFilters] = createSignal<FilterState>({ ...props.filters });

	// スコアフィルターモード
	const [scoreFilterMode, setScoreFilterMode] = createSignal<
		"number" | "rank"
	>("rank");
	const [scoreRankMin, setScoreRankMin] = createSignal("0点");
	const [scoreRankMax, setScoreRankMax] = createSignal("MAX");

	// 各ダイアログの開閉状態
	const [trackingDialogOpen, setTrackingDialogOpen] = createSignal(false);
	const [resetDialogOpen, setResetDialogOpen] = createSignal(false);
	const [saveDialogOpen, setSaveDialogOpen] = createSignal(false);

	// 保存ダイアログ関連
	const [saveName, setSaveName] = createSignal("");
	const [filtersList, setFiltersList] = createSignal<SavedFilter[]>(
		loadSavedFilters(),
	);

	// 追跡条件の状態
	const [trackingCondition, setTrackingCondition] = createSignal(
		loadTrackingCondition(),
	);
	const [trackingTargetFilter, setTrackingTargetFilter] =
		createSignal<SavedFilter | null>(null);

	// 追跡設定ダイアログ関連
	const [trackingScoreEnabled, setTrackingScoreEnabled] = createSignal(false);
	const [trackingLampEnabled, setTrackingLampEnabled] = createSignal(false);
	const [trackingScoreMode, setTrackingScoreMode] = createSignal<
		"number" | "rank"
	>("rank");
	const [trackingScoreRank, setTrackingScoreRank] = createSignal("SSS");
	const [trackingScoreMin, setTrackingScoreMin] = createSignal<number>(1007500);
	const [trackingLamps, setTrackingLamps] = createSignal<
		(typeof LAMP_OPTIONS)[number][]
	>([]);
	const [trackingLampsRadio, setTrackingLampsRadio] = createSignal<string>("");
	const [constMinInput, setConstMinInput] = createSignal(
		props.filters.constMin !== undefined && props.filters.constMin !== null
			? String(props.filters.constMin)
			: "",
	);
	const [constMaxInput, setConstMaxInput] = createSignal(
		props.filters.constMax !== undefined && props.filters.constMax !== null
			? String(props.filters.constMax)
			: "",
	);
	const [scoreMinInput, setScoreMinInput] = createSignal(
		props.filters.scoreMin !== undefined && props.filters.scoreMin !== null
			? String(props.filters.scoreMin)
			: "",
	);
	const [scoreMaxInput, setScoreMaxInput] = createSignal(
		props.filters.scoreMax !== undefined && props.filters.scoreMax !== null
			? String(props.filters.scoreMax)
			: "",
	);


	// 保存ダイアログが開かれたときに追跡の状況を同期
	createEffect(() => {
		if (saveDialogOpen()) {
			setTrackingCondition(loadTrackingCondition());
		}
	});

	// フィルターダイアログが開かれた時にフィルター状態を同期
	createEffect(() => {
		if (props.open) {
			setFilters({ ...props.filters });
			setConstMinInput(
				props.filters.constMin !== undefined && props.filters.constMin !== null
					? String(props.filters.constMin)
					: "",
			);
			setConstMaxInput(
				props.filters.constMax !== undefined && props.filters.constMax !== null
					? String(props.filters.constMax)
					: "",
			);
			setScoreMinInput(
				props.filters.scoreMin !== undefined && props.filters.scoreMin !== null
					? String(props.filters.scoreMin)
					: "",
			);
			setScoreMaxInput(
				props.filters.scoreMax !== undefined && props.filters.scoreMax !== null
					? String(props.filters.scoreMax)
					: "",
			);
		}
	});

	/** ダイアログの開閉変更処理 */
	const handleOpenChange = (open: boolean) => {
		props.onOpenChange(open);
	};

	/** フィルター適用処理 */
	const handleApply = () => {
		props.onChange(filters());
		props.onOpenChange(false);
	};

	/** フィルターリセット処理 */
	const handleReset = () => {
		const def = props.defaultFilter;
		setFilters({ ...def });
		setConstMinInput(String(def.constMin));
		setConstMaxInput(String(def.constMax));
		setScoreMinInput(String(def.scoreMin));
		setScoreMaxInput(String(def.scoreMax));
		setScoreFilterMode("rank");
		setScoreRankMin("0点");
		setScoreRankMax("MAX");
	};

	/** スコアランク変更時の処理(ランクからスコアへの変換と適応) */
	const handleScoreRankChange = (type: "min" | "max", value: string) => {
		if (type === "min") {
			setScoreRankMin(value);
			setFilters((prev) => ({
				...prev,
				scoreMin: SCORE_RANK_VALUES[value as keyof typeof SCORE_RANK_VALUES],
			}));
		} else {
			setScoreRankMax(value);
			setFilters((prev) => ({
				...prev,
				scoreMax: SCORE_RANK_VALUES[value as keyof typeof SCORE_RANK_VALUES],
			}));
		}
	};

	/** 追跡状態を同期する処理 */
	const syncTrackingState = () => {
		const current = loadTrackingCondition();
		setTrackingCondition(current);
		props.onTrackingChange?.();
	};

	/** 追跡設定ダイアログを開く処理(入力欄の初期化) */
	const openTrackingDialog = (item: SavedFilter) => {
		clearTrackingCondition();
		setTrackingTargetFilter(item);
		setTrackingScoreEnabled(false);
		setTrackingScoreMode("rank");
		setTrackingScoreMin(1007500);
		setTrackingScoreRank("SSS");
		setTrackingLampEnabled(false);
		setTrackingLamps([]);
		setTrackingDialogOpen(true);
	};

	/** 追跡設定保存処理 */
	const handleSaveTracking = () => {
		const target = trackingTargetFilter();
		if (!target) return;
		const hasScore = trackingScoreEnabled();
		const hasLamp = trackingLampEnabled();

		// trackingLampsRadioからselectedLampsを決定する
		if (trackingLampsRadio() === "ALL JUSTICE") {
			setTrackingLamps(["ALL JUSTICE"]);
		} else if (trackingLampsRadio() === "FULL COMBO") {
			setTrackingLamps(["ALL JUSTICE", "FULL COMBO"]);
		}
		const selectedLamps = trackingLamps();
		if (!hasScore && !hasLamp) return;
		saveTrackingCondition({
			filterId: target.id,
			filterName: target.name,
			scoreMin: hasScore ? trackingScoreMin() : undefined,
			lamps: hasLamp ? selectedLamps : undefined,
			savedAt: Date.now(),
		});
		setTrackingDialogOpen(false);
		syncTrackingState();
		// TODO: 追跡決定時にすべて閉じる？どうする？
		// setSaveDialogOpen(false);
		// props.onOpenChange(false);
	};

	/** 追跡状態クリア処理 */
	const handleClearTracking = () => {
		clearTrackingCondition();
		syncTrackingState();
	};

	/** 指定のフィルターが追跡中かどうかを返す */
	const isTrackingActiveFor = (id: string) =>
		trackingCondition()?.filterId === id;

	/** 保存済みフィルター適用処理 */
	const handleApplySavedFilter = (filter: FilterState) => {
		props.onChange(filter);
		setSaveDialogOpen(false);
		props.onOpenChange(false);
		syncTrackingState();
	};

	/** 保存済みフィルター削除処理 */
	const handleDeleteSavedFilter = (id: string) => {
		deleteFilter(id);
		setFiltersList(loadSavedFilters());
		if (isTrackingActiveFor(id)) {
			handleClearTracking();
		}
	};

	/** 新しいフィルターを保存する処理 */
	const handleSaveNewFilter = ({ track }: { track: boolean }) => {
		const name = saveName().trim();
		if (!name) return;
		const id = saveNewFilter(name, filters());
		setSaveName("");
		setFiltersList(loadSavedFilters());
		syncTrackingState();
		if (track) {
			const newFilter = loadSavedFilters().find((filter) => filter.id === id);
			if (newFilter) {
				openTrackingDialog(newFilter);
			}
		}
	};

	const difficulties = () =>
		props.masterData?.difficulties?.map((d) => d.name as Difficulty) ?? [];
	const genres = () => props.masterData?.genres?.map((g) => g.name) ?? [];

	return (
		<Dialog open={props.open} onOpenChange={handleOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay class="fixed inset-0 bg-black/30 z-40" />
				<Dialog.Content class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-md max-h-[80vh] flex flex-col">
					<div class="flex items-center justify-between mb-4 shrink-0">
						<Dialog.Title class="text-lg font-bold">
							フィルター
						</Dialog.Title>
						<AlertDialog
							open={resetDialogOpen()}
							onOpenChange={setResetDialogOpen}
						>
							<AlertDialog.Trigger>
								<div class="p-2 rounded bg-red-100 border border-red-500">
									<RotateCcw class="w-5 h-5  text-gray-600 cursor-pointer" />
								</div>
							</AlertDialog.Trigger>
							<AlertDialog.Portal>
								<AlertDialog.Overlay class="fixed inset-0 bg-black/30 z-50" />
								<AlertDialog.Content class="fixed z-60 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-md">
									<AlertDialog.Title class="text-lg font-bold mb-2">
										フィルターをリセットしますか？
									</AlertDialog.Title>
									<AlertDialog.Description class="mb-4 text-sm text-gray-600">
										すべてのフィルター設定が初期値に戻ります。
									</AlertDialog.Description>
									<div class="flex justify-end gap-2">
										<AlertDialog.CloseButton
											as="button"
											class="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
										>
											キャンセル
										</AlertDialog.CloseButton>
										<button
											type="button"
											class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
											onClick={() => {
												handleReset();
												setResetDialogOpen(false);
											}}
										>
											リセット
										</button>
									</div>
								</AlertDialog.Content>
							</AlertDialog.Portal>
						</AlertDialog>
					</div>
					<div class="space-y-4 overflow-y-auto flex-1 min-h-0">
						<DifficultySection
							difficulties={difficulties()}
							selected={filters().difficulties}
							onToggle={(diff) =>
								setFilters((prev) => ({
									...prev,
									difficulties: toggleArray(prev.difficulties, diff),
								}))
							}
						/>
						<ConstRangeSection
							minValue={constMinInput()}
							maxValue={constMaxInput()}
							onMinInput={setConstMinInput}
							onMaxInput={setConstMaxInput}
							onMinCommit={(value) => {
								setConstMinInput(value);
								setFilters((prev) => ({
									...prev,
									constMin: parseNumberInput(value) ?? 0.0,
								}));
							}}
							onMaxCommit={(value) => {
								setConstMaxInput(value);
								setFilters((prev) => ({
									...prev,
									constMax: parseNumberInput(value) ?? 15.9,
								}));
							}}
						/>
						<ScoreSection
							scoreFilterMode={scoreFilterMode()}
							scoreMinInput={scoreMinInput()}
							scoreMaxInput={scoreMaxInput()}
							scoreRankMin={scoreRankMin()}
							scoreRankMax={scoreRankMax()}
							excludeNoPlay={filters().excludeNoPlay}
							onScoreFilterModeChange={setScoreFilterMode}
							onScoreMinInput={setScoreMinInput}
							onScoreMaxInput={setScoreMaxInput}
							onScoreMinCommit={(value) => {
								setScoreMinInput(value);
								setFilters((prev) => ({
									...prev,
									scoreMin: parseNumberInput(value) ?? 0,
								}));
							}}
							onScoreMaxCommit={(value) => {
								setScoreMaxInput(value);
								setFilters((prev) => ({
									...prev,
									scoreMax: parseNumberInput(value) ?? 1010000,
								}));
							}}
							onScoreRankChange={handleScoreRankChange}
							onExcludeNoPlayChange={(checked) =>
								setFilters((prev) => ({
									...prev,
									excludeNoPlay: checked,
								}))
							}
						/>
						<GenreSection
							genres={genres()}
							selected={filters().genres}
							onSelectAll={() =>
								setFilters((prev) => ({
									...prev,
									genres: genres(),
								}))
							}
							onClear={() =>
								setFilters((prev) => ({
									...prev,
									genres: [],
								}))
							}
							onToggle={(genre) =>
								setFilters((prev) => ({
									...prev,
									genres: toggleArray(prev.genres, genre),
								}))
							}
						/>
						<VersionSection
							versions={[...CHUNITHM_VERSIONS]}
							selected={filters().versions}
							onSelectAll={() =>
								setFilters((prev) => ({
									...prev,
									versions: [...CHUNITHM_VERSIONS],
								}))
							}
							onClear={() =>
								setFilters((prev) => ({
									...prev,
									versions: [],
								}))
							}
							onToggle={(version) =>
								setFilters((prev) => ({
									...prev,
									versions: toggleArray(prev.versions, version),
								}))
							}
						/>
						<LampSection
							lamps={LAMP_OPTIONS}
							selected={filters().lamps}
							onToggle={(lamp) =>
								setFilters((prev) => ({
									...prev,
									lamps: toggleArray(prev.lamps, lamp).filter(
										(l): l is "FULL COMBO" | "ALL JUSTICE" | null =>
											l === "FULL COMBO" || l === "ALL JUSTICE" || l === null
									),
								}))
							}
						/>
					</div>
					<div class="flex justify-between mt-6">
						<button
							type="button"
							class="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
							onClick={() => setSaveDialogOpen(true)}
						>
							保存・呼出
						</button>
						<SaveDialog
							open={saveDialogOpen()}
							onOpenChange={setSaveDialogOpen}
							filtersList={filtersList()}
							saveName={saveName()}
							onSaveNameChange={setSaveName}
							onDeleteFilter={handleDeleteSavedFilter}
							onApplyFilter={handleApplySavedFilter}
							onStartTracking={openTrackingDialog}
							onClearTracking={handleClearTracking}
							isTrackingActiveFor={isTrackingActiveFor}
							onSaveAndTrack={() => handleSaveNewFilter({ track: true })}
							onSaveOnly={() => handleSaveNewFilter({ track: false })}
						/>
						<TrackingDialog
							open={trackingDialogOpen()}
							onOpenChange={setTrackingDialogOpen}
							targetName={trackingTargetFilter()?.name ?? "-"}
							trackingScoreEnabled={trackingScoreEnabled()}
							trackingScoreMode={trackingScoreMode()}
							trackingScoreMin={trackingScoreMin()}
							trackingScoreRank={trackingScoreRank()}
							trackingLampEnabled={trackingLampEnabled()}
							trackingLampsRadio={trackingLampsRadio()}
							lampOptions={
								LAMP_OPTIONS.filter(
									(lamp): lamp is Exclude<typeof lamp, null> => lamp !== null
								)
							}
							onTrackingScoreEnabledChange={setTrackingScoreEnabled}
							onTrackingScoreModeChange={setTrackingScoreMode}
							onTrackingScoreMinChange={setTrackingScoreMin}
							onTrackingScoreRankChange={(value) => {
								setTrackingScoreRank(value);
								setTrackingScoreMin(
									SCORE_RANK_VALUES[value as keyof typeof SCORE_RANK_VALUES],
								);
							}}
							onTrackingLampEnabledChange={setTrackingLampEnabled}
							onTrackingLampsRadioChange={setTrackingLampsRadio}
							onSave={handleSaveTracking}
							canSave={trackingScoreEnabled() || trackingLampEnabled()}
						/>
						<div class="flex gap-2">
							<button
								type="button"
								class="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
								onClick={() => props.onOpenChange(false)}
							>
								キャンセル
							</button>
							<button
								type="button"
								class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
								onClick={handleApply}
							>
								適用
							</button>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog>
	);
};

export default FilterDialog;

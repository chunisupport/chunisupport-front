import { AlertDialog } from "@kobalte/core/alert-dialog";
import { Checkbox } from "@kobalte/core/checkbox";
import { Dialog } from "@kobalte/core/dialog";
import { NumberField } from "@kobalte/core/number-field";
import { Popover } from "@kobalte/core/popover";
import { RadioGroup } from "@kobalte/core/radio-group";
import { Select } from "@kobalte/core/select";
import { TextField } from "@kobalte/core/text-field";
import { Check, ChevronDown, EllipsisVertical, RotateCcw } from "lucide-solid";
import type { Component } from "solid-js";
import { createEffect, createSignal, For } from "solid-js";
import type { MasterDataDTO } from "../../../../types/api";
import { CHUNITHM_VERSIONS } from "../../../../utils/versionConverter";
import { LAMP_OPTIONS } from "../types/filterDefaults";
import type { Difficulty, FilterState } from "../types/types";
import { SCORE_RANK_VALUES, SCORE_RANKS } from "../utils/scoreRank";
import {
	clearTrackingCondition,
	deleteFilter,
	loadSavedFilters,
	loadTrackingCondition,
	type SavedFilter,
	saveNewFilter,
	saveTrackingCondition,
} from "../utils/storage";

// フィルター要約
function formatFilterSummary(filter: FilterState): string {
	const parts: string[] = [];
	if (filter.excludeNoPlay) parts.push("未プレイ除外");
	if (filter.difficulties.length > 0)
		parts.push(`難易度: ${filter.difficulties.join(",")}`);
	if (filter.constMin !== 0.0 || filter.constMax !== 15.9)
		parts.push(`定数: ${filter.constMin}-${filter.constMax}`);
	if (filter.scoreMin !== 0 || filter.scoreMax !== 1010000)
		parts.push(`スコア: ${filter.scoreMin}-${filter.scoreMax}`);
	if (filter.genres.length > 0)
		parts.push(`ジャンル: ${filter.genres.join(",")}`);
	if (filter.lamps.length > 0)
		parts.push(`ランプ: ${filter.lamps.map((l) => l ?? "なし").join(",")}`);
	if (filter.versions.length > 0)
		parts.push(`バージョン: ${filter.versions.join(",")}`);
	return parts.join("\n");
}

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
	const [filters, setFilters] = createSignal<FilterState>({ ...props.filters });
	const [saveName, setSaveName] = createSignal("");
	const [filtersList, setFiltersList] = createSignal<SavedFilter[]>(
		loadSavedFilters(),
	);
	const [trackingCondition, setTrackingCondition] = createSignal(
		loadTrackingCondition(),
	);
	const [trackingDialogOpen, setTrackingDialogOpen] = createSignal(false);
	const [trackingTargetFilter, setTrackingTargetFilter] =
		createSignal<SavedFilter | null>(null);
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

	// リセット確認ダイアログの開閉状態
	const [resetDialogOpen, setResetDialogOpen] = createSignal(false);

	// 保存・呼出ダイアログの開閉状態
	const [saveDialogOpen, setSaveDialogOpen] = createSignal(false);

	createEffect(() => {
		if (saveDialogOpen()) {
			setTrackingCondition(loadTrackingCondition());
		}
	});

	/**
	 * props.filters同期
	 * - props.openがtrueかつfilters値が変化したときのみ同期
	 * - scoreFilterMode/scoreRankMin/scoreRankMaxはprops.filtersの値から推定
	 * - handleOpenChangeでは初期化しない
	 */
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
			// スコアフィルターモード・ランクはprops.filtersの値から復元
			if (props.filters.scoreMin === 0 && props.filters.scoreMax === 1010000) {
				setScoreFilterMode("rank");
				setScoreRankMin("0点");
				setScoreRankMax("MAX");
			}
			// それ以外は現状維持（ユーザー操作を上書きしない）
		}
	});

	// handleOpenChangeは同期処理を行わず、open状態のみ伝播

	// 入力中の値（string）を保持するSignal
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

	// string→number|undefined 変換
	const parseNumberInput = (v: string): number | undefined => {
		if (v === "" || v === ".") return undefined;
		if (/^\.\d+$/.test(v)) return parseFloat(`0${v}`);
		if (/^\d+\.$/.test(v)) return undefined; // 末尾ドットは未確定
		const n = Number(v);
		return Number.isNaN(n) ? undefined : n;
	};

	// スコアランク定義
	// スコアランク定義（共通定数を利用）

	// スコアフィルターモード
	const [scoreFilterMode, setScoreFilterMode] = createSignal<"number" | "rank">(
		"rank",
	);
	const [scoreRankMin, setScoreRankMin] = createSignal("0点");
	const [scoreRankMax, setScoreRankMax] = createSignal("MAX");

	// Dialogが開かれた時にフィルター状態をリセット
	const handleOpenChange = (open: boolean) => {
		props.onOpenChange(open);
	};

	const handleApply = () => {
		props.onChange(filters());
		props.onOpenChange(false);
	};

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

	// チェックボックスのトグル
	const toggleArray = <T,>(arr: T[], value: T): T[] =>
		arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

	// スコアランク選択時の反映
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

	// モード切り替え時の値同期
	const handleScoreFilterModeChange = (mode: "number" | "rank") => {
		setScoreFilterMode(mode);
		if (mode === "rank") {
			// 現在のscoreMin/scoreMaxから最も近いランクを選択
			const minRank = SCORE_RANKS.reduce(
				(acc, cur) =>
					SCORE_RANK_VALUES[cur] <= filters().scoreMin ? cur : acc,
				"0点",
			);
			const maxRank = SCORE_RANKS.reduce(
				(acc, cur) =>
					SCORE_RANK_VALUES[cur] >= filters().scoreMax ? cur : acc,
				"MAX",
			);
			setScoreRankMin(minRank);
			setScoreRankMax(maxRank);
		}
	};

	const syncTrackingState = () => {
		const current = loadTrackingCondition();
		setTrackingCondition(current);
		props.onTrackingChange?.();
	};

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
	};

	const handleClearTracking = () => {
		clearTrackingCondition();
		syncTrackingState();
	};

	const isTrackingActiveFor = (id: string) =>
		trackingCondition()?.filterId === id;

	return (
		<Dialog open={props.open} onOpenChange={handleOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay class="fixed inset-0 bg-black/30 z-40" />
				<Dialog.Content class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-md max-h-[80vh] flex flex-col">
					<div class="flex items-center justify-between mb-4 shrink-0">
						<Dialog.Title class="text-lg font-bold">フィルター</Dialog.Title>
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
						{/* 難易度 */}
						<div>
							<span class="block text-sm font-medium mb-1">難易度</span>
							<div class="flex flex-col gap-2">
								<For
									each={
										props.masterData?.difficulties?.map(
											(d) => d.name as Difficulty,
										) ?? []
									}
								>
									{(diff, i) => {
										const id = `filter-difficulty-${i()}`;
										return (
											<Checkbox
												checked={filters().difficulties.includes(diff)}
												onChange={() =>
													setFilters((prev) => ({
														...prev,
														difficulties: toggleArray(
															prev.difficulties,
															diff as Difficulty,
														),
													}))
												}
												class="flex"
											>
												<Checkbox.Input id={id} />
												<Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white flex items-center justify-center mr-2">
													<Checkbox.Indicator>
														<Check class="h-4 w-4" />
													</Checkbox.Indicator>
												</Checkbox.Control>
												<Checkbox.Label for={id}>{diff}</Checkbox.Label>
											</Checkbox>
										);
									}}
								</For>
							</div>
						</div>
						{/* 定数 */}
						<div class="flex gap-2">
							<div class="flex-1">
								<NumberField
									value={constMinInput()}
									onChange={(v: string) => {
										setConstMinInput(v);
									}}
									class="w-full"
									format={false}
									allowedInput={/[0-9.]/}
									step={0.1}
								>
									<NumberField.Label class="block text-sm font-medium mb-1">
										定数(最小)
									</NumberField.Label>
									<NumberField.Input
										id="filter-const-min"
										class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400  focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
										onFocus={(e) => e.currentTarget.select()}
										onBlur={(e) => {
											const v = e.currentTarget.value;
											setConstMinInput(v);
											setFilters((prev) => ({
												...prev,
												constMin: parseNumberInput(v) ?? 0.0,
											}));
										}}
									/>
								</NumberField>
							</div>
							<div class="flex-1">
								<NumberField
									value={constMaxInput()}
									onChange={(v: string) => {
										setConstMaxInput(v);
									}}
									class="w-full"
									format={false}
									allowedInput={/[0-9.]/}
									step={0.1}
								>
									<NumberField.Label class="block text-sm font-medium mb-1">
										定数(最大)
									</NumberField.Label>
									<NumberField.Input
										id="filter-const-max"
										min={0}
										max={15.9}
										step={0.1}
										class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
										onFocus={(e) => e.currentTarget.select()}
										onBlur={(e) => {
											const v = e.currentTarget.value;
											setConstMaxInput(v);
											setFilters((prev) => ({
												...prev,
												constMax: parseNumberInput(v) ?? 15.9,
											}));
										}}
									/>
								</NumberField>
							</div>
						</div>
						{/* スコア */}
						<div>
							{scoreFilterMode() === "number" ? (
								<div class="flex gap-2">
									<div class="flex-1">
										<NumberField
											value={scoreMinInput()}
											onChange={(v: string) => {
												setScoreMinInput(v);
											}}
											class="w-full"
											format={false}
											allowedInput={/[0-9.]/}
											step={1}
										>
											<NumberField.Label class="block text-sm font-medium mb-1">
												スコア(最小)
											</NumberField.Label>
											<NumberField.Input
												id="filter-score-min"
												min={0}
												max={1010000}
												step={1}
												class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
												onFocus={(e) => e.currentTarget.select()}
												onBlur={(e) => {
													const v = e.currentTarget.value;
													setScoreMinInput(v);
													setFilters((prev) => ({
														...prev,
														scoreMin: parseNumberInput(v) ?? 0,
													}));
												}}
											/>
										</NumberField>
									</div>
									<div class="flex-1">
										<NumberField
											value={scoreMaxInput()}
											onChange={(v: string) => {
												setScoreMaxInput(v);
											}}
											class="w-full"
											format={false}
											allowedInput={/[0-9.]/}
											step={1}
										>
											<NumberField.Label class="block text-sm font-medium mb-1">
												スコア(最大)
											</NumberField.Label>
											<NumberField.Input
												id="filter-score-max"
												min={0}
												max={1010000}
												step={1}
												class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
												onFocus={(e) => e.currentTarget.select()}
												onBlur={(e) => {
													const v = e.currentTarget.value;
													setScoreMaxInput(v);
													setFilters((prev) => ({
														...prev,
														scoreMax: parseNumberInput(v) ?? 1010000,
													}));
												}}
											/>
										</NumberField>
									</div>
								</div>
							) : (
								<div class="flex gap-2">
									<div class="flex-1">
										<Select
											options={SCORE_RANKS}
											value={scoreRankMin()}
											onChange={(v) => {
												if (v !== null) handleScoreRankChange("min", v);
											}}
											class="w-full"
											placeholder="選択…"
											itemComponent={(props) => (
												<Select.Item
													item={props.item}
													class="text-sm rounded flex items-center justify-between h-8 px-2 outline-none cursor-pointer data-disabled:opacity-50 data-disabled:pointer-events-none data-highlighted:bg-blue-500 data-highlighted:text-white"
												>
													<Select.ItemLabel>
														{props.item.rawValue}
													</Select.ItemLabel>
													<Select.ItemIndicator class="indicator h-5 w-5 inline-flex items-center justify-center">
														<Check />
													</Select.ItemIndicator>
												</Select.Item>
											)}
										>
											<Select.Label class="block text-sm font-medium mb-1">
												スコアランク(最小)
											</Select.Label>
											<Select.Trigger class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2">
												<Select.Value<string> class="overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-gray-400">
													{(state) => state.selectedOption()}
												</Select.Value>
												<Select.Icon class="h-5 w-5 flex items-center justify-center">
													<ChevronDown />
												</Select.Icon>
											</Select.Trigger>
											<Select.Portal>
												<Select.Content class="z-60 bg-white rounded-md border border-gray-300 shadow-lg">
													<Select.Listbox class="overflow-y-auto max-h-90 p-2" />
												</Select.Content>
											</Select.Portal>
										</Select>
									</div>
									<div class="flex-1">
										<Select
											options={SCORE_RANKS}
											value={scoreRankMax()}
											onChange={(v) => {
												if (v !== null) handleScoreRankChange("max", v);
											}}
											class="w-full"
											placeholder="選択…"
											itemComponent={(props) => (
												<Select.Item
													item={props.item}
													class="text-sm rounded flex items-center justify-between h-8 px-2 outline-none cursor-pointer data-disabled:opacity-50 data-disabled:pointer-events-none data-highlighted:bg-blue-500 data-highlighted:text-white"
												>
													<Select.ItemLabel>
														{props.item.rawValue}
													</Select.ItemLabel>
													<Select.ItemIndicator class="h-5 w-5 inline-flex items-center justify-center">
														<Check />
													</Select.ItemIndicator>
												</Select.Item>
											)}
										>
											<Select.Label class="block text-sm font-medium mb-1">
												スコアランク(最大)
											</Select.Label>
											<Select.Trigger class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2">
												<Select.Value<string> class="overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-gray-400">
													{(state) => state.selectedOption()}
												</Select.Value>
												<Select.Icon class="h-5 w-5 flex items-center justify-center">
													<ChevronDown />
												</Select.Icon>
											</Select.Trigger>
											<Select.Portal>
												<Select.Content class="z-60 bg-white rounded-md border border-gray-300 shadow-lg">
													<Select.Listbox class="overflow-y-auto max-h-90 p-2" />
												</Select.Content>
											</Select.Portal>
										</Select>
									</div>
								</div>
							)}
							<div class="mt-2">
								<Checkbox
									checked={scoreFilterMode() === "number"}
									onChange={(checked) =>
										handleScoreFilterModeChange(checked ? "number" : "rank")
									}
									class="flex items-center"
								>
									<Checkbox.Input id="filter-score-mode" />
									<Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white flex items-center justify-center mr-2">
										<Checkbox.Indicator>
											<Check class="h-4 w-4" />
										</Checkbox.Indicator>
									</Checkbox.Control>
									<Checkbox.Label for="filter-score-mode">
										数値で指定する
									</Checkbox.Label>
								</Checkbox>
							</div>
							<div class="mt-2">
								<Checkbox
									checked={filters().excludeNoPlay}
									onChange={(checked) =>
										setFilters((prev) => ({
											...prev,
											excludeNoPlay: checked,
										}))
									}
									class="flex items-center"
								>
									<Checkbox.Input id="filter-exclude-noplay" />
									<Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white flex items-center justify-center mr-2">
										<Checkbox.Indicator>
											<Check class="h-4 w-4" />
										</Checkbox.Indicator>
									</Checkbox.Control>
									<Checkbox.Label for="filter-exclude-noplay">
										未プレイ譜面を除外する
									</Checkbox.Label>
								</Checkbox>
							</div>
						</div>
						{/* ジャンル */}
						<div>
							<span class="block text-sm font-medium mb-1">ジャンル</span>
							<div class="flex gap-2 mb-1">
								<button
									type="button"
									class="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs"
									onClick={() =>
										setFilters((prev) => ({
											...prev,
											genres:
												props.masterData?.genres?.map((g) => g.name) ?? [],
										}))
									}
								>
									すべて選択
								</button>
								<button
									type="button"
									class="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs"
									onClick={() =>
										setFilters((prev) => ({
											...prev,
											genres: [],
										}))
									}
								>
									すべて解除
								</button>
							</div>
							<div class="flex flex-col gap-2">
								<For each={props.masterData?.genres?.map((g) => g.name) ?? []}>
									{(genre, i) => {
										const id = `filter-genre-${i()}`;
										return (
											<Checkbox
												checked={filters().genres.includes(genre)}
												onChange={() =>
													setFilters((prev) => ({
														...prev,
														genres: toggleArray(prev.genres, genre),
													}))
												}
												class="flex"
											>
												<Checkbox.Input id={id} />
												<Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white flex items-center justify-center mr-2">
													<Checkbox.Indicator>
														<Check class="h-4 w-4" />
													</Checkbox.Indicator>
												</Checkbox.Control>
												<Checkbox.Label for={id}>{genre}</Checkbox.Label>
											</Checkbox>
										);
									}}
								</For>
							</div>
						</div>
						{/* バージョン */}
						<div>
							<span class="block text-sm font-medium mb-1">バージョン</span>
							<div class="flex gap-2 mb-1">
								<button
									type="button"
									class="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs"
									onClick={() =>
										setFilters((prev) => ({
											...prev,
											versions: [...CHUNITHM_VERSIONS],
										}))
									}
								>
									すべて選択
								</button>
								<button
									type="button"
									class="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs"
									onClick={() =>
										setFilters((prev) => ({
											...prev,
											versions: [],
										}))
									}
								>
									すべて解除
								</button>
							</div>
							<div class="flex flex-col gap-2">
								<For each={CHUNITHM_VERSIONS}>
									{(ver, i) => {
										const id = `filter-version-${i()}`;
										return (
											<Checkbox
												checked={filters().versions.includes(ver)}
												onChange={() =>
													setFilters((prev) => ({
														...prev,
														versions: toggleArray(prev.versions, ver),
													}))
												}
												class="flex"
											>
												<Checkbox.Input id={id} />
												<Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white flex items-center justify-center mr-2">
													<Checkbox.Indicator>
														<Check class="h-4 w-4" />
													</Checkbox.Indicator>
												</Checkbox.Control>
												<Checkbox.Label for={id}>{ver}</Checkbox.Label>
											</Checkbox>
										);
									}}
								</For>
							</div>
						</div>
						{/* ランプ */}
						<div>
							<span class="block text-sm font-medium mb-1">ランプ</span>
							<div class="flex flex-col gap-2">
								<For each={LAMP_OPTIONS}>
									{(lamp, i) => {
										const id = `filter-lamp-${i()}`;
										return (
											<Checkbox
												checked={filters().lamps.includes(lamp)}
												onChange={() =>
													setFilters((prev) => ({
														...prev,
														lamps: toggleArray(prev.lamps, lamp),
													}))
												}
												class="flex"
											>
												<Checkbox.Input id={id} />
												<Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white flex items-center justify-center mr-2">
													<Checkbox.Indicator>
														<Check class="h-4 w-4" />
													</Checkbox.Indicator>
												</Checkbox.Control>
												<Checkbox.Label for={id}>
													{lamp ?? "なし"}
												</Checkbox.Label>
											</Checkbox>
										);
									}}
								</For>
							</div>
						</div>
					</div>
					<div class="flex justify-between mt-6">
						<button
							type="button"
							class="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
							onClick={() => setSaveDialogOpen(true)}
						>
							保存・呼出
						</button>
						<Dialog open={saveDialogOpen()} onOpenChange={setSaveDialogOpen}>
							<Dialog.Portal>
								<Dialog.Overlay class="fixed inset-0 bg-black/30 z-60" />
								<Dialog.Content class="fixed z-70 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-md border border-gray-300">
									<div class="flex justify-between items-center mb-4">
										<div class="font-bold">フィルター条件の保存・呼出</div>
									</div>
									<div class="mb-4">
										<div class="text-xs text-gray-500 mb-1">保存した条件</div>
										<div class="border border-gray-300 rounded bg-gray-50 px-3 py-2 min-h-80 max-h-80 overflow-y-auto">
											<For each={filtersList()}>
												{(item) => (
													<div class="flex items-center justify-between border-b border-gray-300 py-1">
														<div class="flex-1 min-w-0">
															<div class="truncate">{item.name}</div>
														</div>

														<Popover>
															<Popover.Trigger>
																<EllipsisVertical class="w-5 h-5 text-gray-400 cursor-pointer" />
															</Popover.Trigger>
															<Popover.Portal>
																<Popover.Content class="z-80 border border-gray-300 rounded bg-white shadow p-4">
																	<Popover.Arrow />
																	<div class="mb-4">
																		<div class="text-sm font-sm text-gray-600 mb-2">
																			フィルターの詳細
																		</div>
																		<div class="text-xs text-gray-600 max-w-xs whitespace-pre-line">
																			{formatFilterSummary(item.filter) ||
																				"（条件なし）"}
																		</div>
																	</div>
																	<div class="flex justify-end">
																		<button
																			type="button"
																			class="text-red-600 hover:bg-red-100 px-2 py-1 underline"
																			onClick={() => {
																				deleteFilter(item.id);
																				setFiltersList(loadSavedFilters());
																				if (isTrackingActiveFor(item.id)) {
																					handleClearTracking();
																				}
																			}}
																		>
																			フィルターを削除
																		</button>
																	</div>
																</Popover.Content>
															</Popover.Portal>
														</Popover>
														<button
															type="button"
															class={
																isTrackingActiveFor(item.id)
																	? "ml-2 px-2 py-1 rounded border border-lime-600 text-lime-600 hover:bg-lime-100"
																	: "ml-2 px-2 py-1 rounded bg-lime-600 border text-white"
															}
															onClick={() =>
																isTrackingActiveFor(item.id)
																	? handleClearTracking()
																	: openTrackingDialog(item)
															}
														>
															{isTrackingActiveFor(item.id) ? "解除" : "追跡"}
														</button>
														<button
															type="button"
															class="ml-2 px-2 py-1 rounded bg-blue-500 text-white text hover:bg-blue-700"
															onClick={() => {
																props.onChange(item.filter);
																setSaveDialogOpen(false);
																props.onOpenChange(false);
																syncTrackingState();
															}}
														>
															呼出
														</button>
													</div>
												)}
											</For>
											{filtersList().length === 0 && (
												<div class="w-full text-center text-xs text-gray-400 mt-2">
													保存された条件はありません
												</div>
											)}
										</div>
									</div>
									<div class="mb-6">
										<div class="text-xs text-gray-500 mb-1">
											現在の条件を保存
										</div>
										<TextField class="mb-2">
											<TextField.Input
												class="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500"
												placeholder="フィルターの名前を入力..."
												value={saveName()}
												onInput={(e) => setSaveName(e.currentTarget.value)}
											/>
										</TextField>
										<div class="flex space-x-2 justify-end">
											<button
												type="button"
												class="px-2 py-1 rounded bg-lime-600 text-white hover:bg-lime-700"
												onClick={() => {
													const name = saveName().trim();
													if (name) {
														const id = saveNewFilter(name, filters());
														setSaveName("");
														setFiltersList(loadSavedFilters());
														syncTrackingState();
														const newFilter = loadSavedFilters().find(
															(f) => f.id === id,
														);
														if (newFilter) {
															openTrackingDialog(newFilter);
														}
													}
												}}
												disabled={!saveName().trim()}
											>
												保存して追跡
											</button>
											<button
												type="button"
												class="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
												onClick={() => {
													const name = saveName().trim();
													if (name) {
														saveNewFilter(name, filters());
														setSaveName("");
														setFiltersList(loadSavedFilters());
														syncTrackingState();
													}
												}}
												disabled={!saveName().trim()}
											>
												保存
											</button>
										</div>
									</div>
									<div class="text-right">
										<button
											type="button"
											class="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
											onClick={() => setSaveDialogOpen(false)}
										>
											戻る
										</button>
									</div>
								</Dialog.Content>
							</Dialog.Portal>
						</Dialog>
						<Dialog
							open={trackingDialogOpen()}
							onOpenChange={setTrackingDialogOpen}
						>
							<Dialog.Portal>
								<Dialog.Overlay class="fixed inset-0 bg-black/30 z-70" />
								<Dialog.Content class="fixed z-80 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-md border border-gray-300">
									<div class="font-bold mb-2">
										追跡条件の設定「{trackingTargetFilter()?.name ?? "-"}」
									</div>
									<div class="text-xs text-gray-500 mb-4">
										目標とするスコアもしくはランプ(AJ/FC)を設定してください。
									</div>
									<div class="space-y-4">
										<div>
											<Checkbox
												checked={trackingScoreEnabled()}
												onChange={(checked) => setTrackingScoreEnabled(checked)}
												class="flex items-center"
											>
												<Checkbox.Input id="tracking-score-enabled" />
												<Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white flex items-center justify-center mr-2">
													<Checkbox.Indicator>
														<Check class="h-4 w-4" />
													</Checkbox.Indicator>
												</Checkbox.Control>
												<Checkbox.Label for="tracking-score-enabled">
													目標スコアを有効化
												</Checkbox.Label>
											</Checkbox>
											<div class="flex gap-2 mt-2">
												<div class="flex-1">
													{trackingScoreMode() === "number" ? (
														<NumberField
															value={String(trackingScoreMin())}
															onChange={(v: string) => {
																setTrackingScoreMin(Number(v));
															}}
															class="w-full"
															format={false}
															allowedInput={/[0-9.]/}
															step={1}
															disabled={!trackingScoreEnabled()}
														>
															<NumberField.Input
																id="tracking-score-min"
																min={0}
																max={1010000}
																step={1}
																class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 disabled:bg-gray-100 disabled:text-gray-400"
																onFocus={(e) => e.currentTarget.select()}
																onBlur={(e) => {
																	const v = e.currentTarget.value;
																	setTrackingScoreMin(Number(v));
																}}
																disabled={!trackingScoreEnabled()}
															/>
														</NumberField>
													) : (
														<Select
															options={SCORE_RANKS.filter((r) => r !== "0点")}
															value={trackingScoreRank()}
															onChange={(v) => {
																if (v !== null) {
																	setTrackingScoreRank(v);
																	setTrackingScoreMin(
																		SCORE_RANK_VALUES[
																			v as keyof typeof SCORE_RANK_VALUES
																		],
																	);
																}
															}}
															class="w-full"
															placeholder="選択…"
															disabled={!trackingScoreEnabled()}
															itemComponent={(props) => (
																<Select.Item
																	item={props.item}
																	class="text-sm rounded flex items-center justify-between h-8 px-2 outline-none cursor-pointer data-disabled:opacity-50 data-disabled:pointer-events-none data-highlighted:bg-blue-500 data-highlighted:text-white"
																>
																	<Select.ItemLabel>
																		{props.item.rawValue}
																	</Select.ItemLabel>
																	<Select.ItemIndicator class="indicator h-5 w-5 inline-flex items-center justify-center">
																		<Check />
																	</Select.ItemIndicator>
																</Select.Item>
															)}
														>
															<Select.Trigger class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 disabled:bg-gray-100 disabled:text-gray-400">
																<Select.Value<string> class="overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-gray-400">
																	{(state) => state.selectedOption()}
																</Select.Value>
																<Select.Icon class="h-5 w-5 flex items-center justify-center">
																	<ChevronDown />
																</Select.Icon>
															</Select.Trigger>
															<Select.Portal>
																<Select.Content class="z-80 bg-white rounded-md border border-gray-300 shadow-lg">
																	<Select.Listbox class="overflow-y-auto max-h-90 p-2" />
																</Select.Content>
															</Select.Portal>
														</Select>
													)}
												</div>
											</div>
											<div class="mt-2">
												<Checkbox
													checked={trackingScoreMode() === "number"}
													onChange={(checked) =>
														setTrackingScoreMode(checked ? "number" : "rank")
													}
													class="flex items-center"
													disabled={!trackingScoreEnabled()}
												>
													<Checkbox.Input id="tracing-score-mode" />
													<Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white flex items-center justify-center mr-2">
														<Checkbox.Indicator>
															<Check class="h-4 w-4" />
														</Checkbox.Indicator>
													</Checkbox.Control>
													<Checkbox.Label
														for="tracing-score-mode"
														class={trackingScoreEnabled() ? "" : "text-gray-400"}
													>
														数値で指定する
													</Checkbox.Label>
												</Checkbox>
											</div>
										</div>
										<div>
											<div class="block text-sm font-medium mb-1">ランプ</div>
											<Checkbox
												checked={trackingLampEnabled()}
												onChange={(checked) => setTrackingLampEnabled(checked)}
												class="flex items-center"
											>
												<Checkbox.Input id="tracking-lamp-enabled" />
												<Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white flex items-center justify-center mr-2">
													<Checkbox.Indicator>
														<Check class="h-4 w-4" />
													</Checkbox.Indicator>
												</Checkbox.Control>
												<Checkbox.Label for="tracking-lamp-enabled">
													目標ランプを有効化
												</Checkbox.Label>
											</Checkbox>
											<RadioGroup
												value={trackingLampsRadio()}
												onChange={(v) => {
													setTrackingLampsRadio(v);
												}}
												class="flex flex-col mt-2 gap-2"
												disabled={!trackingLampEnabled()}
											>
												<For
													each={LAMP_OPTIONS.filter((lamp) => lamp !== null)}
												>
													{(lamp, i) => {
														const id = `tracking-lamp-${i()}`;
														return (
															<RadioGroup.Item
																value={lamp}
																class="flex items-center"
															>
																<RadioGroup.ItemInput id={id} />
																<RadioGroup.ItemControl class="h-5 w-5 rounded-full border border-gray-300 bg-gray-50 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white flex items-center justify-center mr-2">
																	<RadioGroup.ItemIndicator>
																		<Check class="h-4 w-4 " />
																	</RadioGroup.ItemIndicator>
																</RadioGroup.ItemControl>
																<RadioGroup.ItemLabel
																	for={id}
																	class={
																		trackingLampEnabled() ? "" : "text-gray-400"
																	}
																>
																	{lamp}
																</RadioGroup.ItemLabel>
															</RadioGroup.Item>
														);
													}}
												</For>
											</RadioGroup>
										</div>
									</div>
									<div class="flex justify-end gap-2 mt-6">
										<button
											type="button"
											class="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
											onClick={() => setTrackingDialogOpen(false)}
										>
											キャンセル
										</button>
										<button
											type="button"
											class="px-4 py-2 rounded bg-lime-600 text-white hover:bg-lime-700 disabled:opacity-60"
											onClick={handleSaveTracking}
											disabled={
												!trackingScoreEnabled() && !trackingLampEnabled()
											}
										>
											決定
										</button>
									</div>
								</Dialog.Content>
							</Dialog.Portal>
						</Dialog>
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

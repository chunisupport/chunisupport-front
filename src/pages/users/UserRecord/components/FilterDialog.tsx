import { AlertDialog } from "@kobalte/core/alert-dialog";
import { Checkbox } from "@kobalte/core/checkbox";
import { Dialog } from "@kobalte/core/dialog";
import { NumberField } from "@kobalte/core/number-field";
import { Select } from "@kobalte/core/select";
import { Check, ChevronDown } from "lucide-solid";
import type { Component } from "solid-js";
import { createEffect, createSignal, For, Show } from "solid-js";
import type { MasterDataDTO } from "../../../../types/api";
import { CHUNITHM_VERSIONS } from "../../../../utils/versionConverter";
import { DEFAULT_FILTER, LAMP_OPTIONS } from "../types/filterDefaults";
import type { Difficulty, FilterState } from "../types/types";

interface SavedFilter {
	id: string;
	name: string;
	filter: FilterState;
	savedAt: number;
}

// LocalStorage操作
const SAVED_FILTERS_KEY = "chunisup_saved_filters";
function loadSavedFilters(): SavedFilter[] {
	try {
		const raw = localStorage.getItem(SAVED_FILTERS_KEY);
		if (!raw) return [];
		return JSON.parse(raw);
	} catch {
		return [];
	}
}
function saveNewFilter(name: string, filter: FilterState) {
	const filters = loadSavedFilters();
	const id = Date.now().toString();
	filters.push({ id, name, filter, savedAt: Date.now() });
	localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters));
}
function deleteFilter(id: string) {
	const filters = loadSavedFilters().filter((f) => f.id !== id);
	localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters));
}

// フィルター要約
function formatFilterSummary(filter: FilterState): string {
	const parts: string[] = [];
	if (filter.difficulties.length > 0)
		parts.push(`難易度: ${filter.difficulties.join(",")}`);
	if (filter.constMin !== 0.0 || filter.constMax !== 15.9)
		parts.push(`定数: ${filter.constMin}-${filter.constMax}`);
	if (filter.scoreMin !== 0 || filter.scoreMax !== 1010000)
		parts.push(`スコア: ${filter.scoreMin}-${filter.scoreMax}`);
	if (filter.genres.length > 0)
		parts.push(`ジャンル: ${filter.genres.join(",")}`);
	if (filter.versions.length > 0)
		parts.push(`バージョン: ${filter.versions.join(",")}`);
	if (filter.lamps.length > 0)
		parts.push(`ランプ: ${filter.lamps.map((l) => l ?? "なし").join(",")}`);
	if (filter.excludeNoPlay) parts.push("未プレイ除外");
	return parts.join(" / ");
}

interface FilterDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	filters: FilterState;
	onChange: (filters: FilterState) => void;
	masterData?: MasterDataDTO;
}

export const FilterDialog: Component<FilterDialogProps> = (props) => {
	const [filters, setFilters] = createSignal<FilterState>({ ...props.filters });

	// リセット確認ダイアログの開閉状態
	const [resetDialogOpen, setResetDialogOpen] = createSignal(false);

	// 保存・呼出ダイアログの開閉状態
	const [saveDialogOpen, setSaveDialogOpen] = createSignal(false);

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
	type ScoreRank = "SSS+" | "SSS" | "SS+" | "SS" | "S+" | "S" | "0点" | "MAX";
	const SCORE_RANKS: ScoreRank[] = [
		"0点",
		"S",
		"S+",
		"SS",
		"SS+",
		"SSS",
		"SSS+",
		"MAX",
	];
	const SCORE_RANK_VALUES: Record<ScoreRank, number> = {
		"SSS+": 1009000,
		SSS: 1007500,
		"SS+": 1005000,
		SS: 1000000,
		"S+": 990000,
		S: 975000,
		"0点": 0,
		MAX: 1010000,
	};

	// スコアフィルターモード
	const [scoreFilterMode, setScoreFilterMode] = createSignal<"number" | "rank">(
		"rank",
	);
	const [scoreRankMin, setScoreRankMin] = createSignal<ScoreRank>("0点");
	const [scoreRankMax, setScoreRankMax] = createSignal<ScoreRank>("MAX");

	// Dialogが開かれた時にフィルター状態をリセット
	const handleOpenChange = (open: boolean) => {
		props.onOpenChange(open);
	};

	const handleApply = () => {
		props.onChange(filters());
		props.onOpenChange(false);
	};

	const handleReset = () => {
		setFilters({ ...DEFAULT_FILTER });
		setConstMinInput(String(DEFAULT_FILTER.constMin));
		setConstMaxInput(String(DEFAULT_FILTER.constMax));
		setScoreMinInput(String(DEFAULT_FILTER.scoreMin));
		setScoreMaxInput(String(DEFAULT_FILTER.scoreMax));
		setScoreFilterMode("rank");
		setScoreRankMin("0点");
		setScoreRankMax("MAX");
	};

	// チェックボックスのトグル
	const toggleArray = <T,>(arr: T[], value: T): T[] =>
		arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

	// スコアランク選択時の反映
	const handleScoreRankChange = (type: "min" | "max", value: ScoreRank) => {
		if (type === "min") {
			setScoreRankMin(value);
			setFilters((prev) => ({
				...prev,
				scoreMin: SCORE_RANK_VALUES[value],
			}));
		} else {
			setScoreRankMax(value);
			setFilters((prev) => ({
				...prev,
				scoreMax: SCORE_RANK_VALUES[value],
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
				"0点" as ScoreRank,
			);
			const maxRank = SCORE_RANKS.reduce(
				(acc, cur) =>
					SCORE_RANK_VALUES[cur] >= filters().scoreMax ? cur : acc,
				"MAX" as ScoreRank,
			);
			setScoreRankMin(minRank);
			setScoreRankMax(maxRank);
		}
	};

	return (
		<Dialog open={props.open} onOpenChange={handleOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay class="fixed inset-0 bg-black/30 z-40" />
				<Dialog.Content class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-md max-h-[80vh] flex flex-col">
					<div class="flex items-center justify-between mb-4 shrink-0">
						<Dialog.Title class="text-lg font-bold">フィルター</Dialog.Title>
						<button
							type="button"
							class="ml-2 px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-blue-100 text-xs border border-gray-300"
							onClick={() => setSaveDialogOpen(true)}
						>
							条件の保存・呼出
						</button>
					</div>
					<Show when={saveDialogOpen()}>
						<div class="fixed z-60 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-md border border-gray-300">
							<div class="flex justify-between items-center mb-2">
								<div class="font-bold">条件の保存・呼出</div>
								<button
									type="button"
									class="text-gray-500 hover:text-gray-700"
									onClick={() => setSaveDialogOpen(false)}
								>
									×
								</button>
							</div>
							<div class="mb-2">
								<div class="text-xs text-gray-500 mb-1">現在の条件</div>
								<div class="text-sm border rounded px-2 py-1 bg-gray-50 mb-2">
									{formatFilterSummary(filters())}
								</div>
								<button
									type="button"
									class="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
									onClick={() => {
										const name = window.prompt("保存名を入力してください", "");
										if (name?.trim()) {
											saveNewFilter(name.trim(), filters());
											setSaveDialogOpen(false);
										}
									}}
								>
									この条件を保存
								</button>
							</div>
							<div class="mt-4">
								<div class="text-xs text-gray-500 mb-1">保存済み条件</div>
								<For each={loadSavedFilters()}>
									{(item) => (
										<div class="flex items-center justify-between border-b py-1">
											<div class="flex-1 min-w-0">
												<div class="font-bold text-sm truncate">
													{item.name}
												</div>
												<div class="text-xs text-gray-500 truncate">
													{formatFilterSummary(item.filter)}
												</div>
											</div>
											<button
												type="button"
												class="ml-2 px-2 py-1 rounded bg-blue-500 text-white text-xs hover:bg-blue-700"
												onClick={() => {
													props.onChange(item.filter);
													setSaveDialogOpen(false);
													props.onOpenChange(false);
												}}
											>
												呼出
											</button>
											<button
												type="button"
												class="ml-1 px-2 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-700"
												onClick={() => {
													deleteFilter(item.id);
													setSaveDialogOpen(false);
													setTimeout(() => setSaveDialogOpen(true), 0); // 再表示でリスト更新
												}}
											>
												削除
											</button>
										</div>
									)}
								</For>
								<Show when={loadSavedFilters().length === 0}>
									<div class="text-xs text-gray-400 mt-2">
										保存された条件はありません
									</div>
								</Show>
							</div>
						</div>
					</Show>
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
												if (v !== null)
													handleScoreRankChange("min", v as ScoreRank);
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
												if (v !== null)
													handleScoreRankChange("max", v as ScoreRank);
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
						{/* リセット確認用AlertDialog */}
						<AlertDialog
							open={resetDialogOpen()}
							onOpenChange={setResetDialogOpen}
						>
							<AlertDialog.Trigger>
								<button
									type="button"
									class="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
								>
									リセット
								</button>
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

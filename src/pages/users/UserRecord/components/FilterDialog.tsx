import { Checkbox } from "@kobalte/core/checkbox";
import { Dialog } from "@kobalte/core/dialog";
import { NumberField } from "@kobalte/core/number-field";
import { Select } from "@kobalte/core/select";
import { Check } from "lucide-solid";
import type { Component } from "solid-js";
import { createSignal, For } from "solid-js";
import type { ComboLamp, Difficulty, FilterState } from "../types/types";

interface FilterDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	filters: FilterState;
	onChange: (filters: FilterState) => void;
	onReset: () => void;
}

const DIFFICULTIES: Difficulty[] = [
	"BASIC",
	"ADVANCED",
	"EXPERT",
	"MASTER",
	"ULTIMA",
];
const LAMPS: ComboLamp[] = ["FULL COMBO", "ALL JUSTICE", null];

export const FilterDialog: Component<FilterDialogProps> = (props) => {
	const [filters, setFilters] = createSignal<FilterState>({ ...props.filters });

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
		if (open) setFilters({ ...props.filters });
	};

	const handleApply = () => {
		props.onChange(filters());
		props.onOpenChange(false);
	};

	const handleReset = () => {
		setFilters({
			title: "",
			difficulties: ["MASTER", "ULTIMA"],
			constMin: 0.0,
			constMax: 15.9,
			scoreMin: 0,
			scoreMax: 1010000,
			lamps: ["ALL JUSTICE", "FULL COMBO", null],
		});
		setScoreFilterMode("rank");
		setScoreRankMin("0点");
		setScoreRankMax("MAX");
		props.onReset();
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
				<Dialog.Content class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-md">
					<Dialog.Title class="text-lg font-bold mb-4">フィルター</Dialog.Title>
					<div class="space-y-4">
						{/* 難易度 */}
						<div>
							<span class="block text-sm font-medium mb-1">難易度</span>
							<div class="flex flex-col gap-2">
								<For each={DIFFICULTIES}>
									{(diff, i) => {
										const id = `filter-difficulty-${i()}`;
										return (
											<Checkbox
												checked={filters().difficulties.includes(diff)}
												onChange={() =>
													setFilters((prev) => ({
														...prev,
														difficulties: toggleArray(prev.difficulties, diff),
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
									value={String(filters().constMin ?? "")}
									onChange={(v: string) =>
										setFilters((prev) => ({
											...prev,
											constMin: Number(v),
										}))
									}
									class="w-full"
								>
									<NumberField.Label class="block text-sm font-medium mb-1">
										定数(最小)
									</NumberField.Label>
									<NumberField.Input
										id="filter-const-min"
										min={0}
										max={15.9}
										step={0.1}
										class="w-full border rounded px-2 py-1"
										onFocus={(e) => e.currentTarget.select()}
									/>
								</NumberField>
							</div>
							<div class="flex-1">
								<NumberField
									value={String(filters().constMax ?? "")}
									onChange={(v: string) =>
										setFilters((prev) => ({
											...prev,
											constMax: Number(v),
										}))
									}
									class="w-full"
								>
									<NumberField.Label class="block text-sm font-medium mb-1">
										定数(最大)
									</NumberField.Label>
									<NumberField.Input
										id="filter-const-max"
										min={0}
										max={15.9}
										step={0.1}
										class="w-full border rounded px-2 py-1"
										onFocus={(e) => e.currentTarget.select()}
									/>
								</NumberField>
							</div>
						</div>
						{/* スコア */}
						<div>
							<div class="flex items-center gap-2 mb-1">
								<span class="block text-sm font-medium">スコア</span>
								<button
									type="button"
									class={`px-2 py-0.5 rounded text-xs border ${scoreFilterMode() === "number" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
									onClick={() => handleScoreFilterModeChange("number")}
								>
									数値
								</button>
								<button
									type="button"
									class={`px-2 py-0.5 rounded text-xs border ${scoreFilterMode() === "rank" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
									onClick={() => handleScoreFilterModeChange("rank")}
								>
									ランク
								</button>
							</div>
							{scoreFilterMode() === "number" ? (
								<div class="flex gap-2">
									<div class="flex-1">
										<NumberField
											value={String(filters().scoreMin ?? "")}
											onChange={(v: string) =>
												setFilters((prev) => ({
													...prev,
													scoreMin: Number(v),
												}))
											}
											class="w-full"
										>
											<NumberField.Label class="block text-sm font-medium mb-1">
												スコア(最小)
											</NumberField.Label>
											<NumberField.Input
												id="filter-score-min"
												min={0}
												max={1010000}
												step={1}
												class="w-full border rounded px-2 py-1"
												onFocus={(e) => e.currentTarget.select()}
											/>
										</NumberField>
									</div>
									<div class="flex-1">
										<NumberField
											value={String(filters().scoreMax ?? "")}
											onChange={(v: string) =>
												setFilters((prev) => ({
													...prev,
													scoreMax: Number(v),
												}))
											}
											class="w-full"
										>
											<NumberField.Label class="block text-sm font-medium mb-1">
												スコア(最大)
											</NumberField.Label>
											<NumberField.Input
												id="filter-score-max"
												min={0}
												max={1010000}
												step={1}
												class="w-full border rounded px-2 py-1"
												onFocus={(e) => e.currentTarget.select()}
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
												<Select.Item item={props.item}>
													<Select.ItemLabel>
														{props.item.rawValue}
													</Select.ItemLabel>
													<Select.ItemIndicator>✓</Select.ItemIndicator>
												</Select.Item>
											)}
										>
											<Select.Label class="block text-sm font-medium mb-1">
												スコアランク(最小)
											</Select.Label>
											<Select.Trigger class="w-full border rounded px-2 py-1 flex items-center justify-between">
												<Select.Value<string>>
													{(state) => state.selectedOption()}
												</Select.Value>
												<Select.Icon />
											</Select.Trigger>
											<Select.Portal>
												<Select.Content>
													<Select.Listbox />
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
												<Select.Item item={props.item}>
													<Select.ItemLabel>
														{props.item.rawValue}
													</Select.ItemLabel>
													<Select.ItemIndicator>✓</Select.ItemIndicator>
												</Select.Item>
											)}
										>
											<Select.Label class="block text-sm font-medium mb-1">
												スコアランク(最大)
											</Select.Label>
											<Select.Trigger class="w-full border rounded px-2 py-1 flex items-center justify-between">
												<Select.Value<string>>
													{(state) => state.selectedOption()}
												</Select.Value>
												<Select.Icon />
											</Select.Trigger>
											<Select.Portal>
												<Select.Content>
													<Select.Listbox />
												</Select.Content>
											</Select.Portal>
										</Select>
									</div>
								</div>
							)}
						</div>
						{/* ランプ */}
						<div>
							<span class="block text-sm font-medium mb-1">ランプ</span>
							<div class="flex flex-col gap-2">
								<For each={LAMPS}>
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
							onClick={handleReset}
						>
							リセット
						</button>
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

import { Checkbox, Dialog, NumberField } from "@kobalte/core";
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
		props.onReset();
	};

	// チェックボックスのトグル
	const toggleArray = <T,>(arr: T[], value: T): T[] =>
		arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

	return (
		<Dialog.Root open={props.open} onOpenChange={handleOpenChange}>
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
											<Checkbox.Root
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
											</Checkbox.Root>
										);
									}}
								</For>
							</div>
						</div>
						{/* 定数 */}
						<div class="flex gap-2">
							<div class="flex-1">
								<NumberField.Root
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
								</NumberField.Root>
							</div>
							<div class="flex-1">
								<NumberField.Root
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
								</NumberField.Root>
							</div>
						</div>
						{/* スコア */}
						<div class="flex gap-2">
							<div class="flex-1">
								<NumberField.Root
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
								</NumberField.Root>
							</div>
							<div class="flex-1">
								<NumberField.Root
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
								</NumberField.Root>
							</div>
						</div>
						{/* ランプ */}
						<div>
							<span class="block text-sm font-medium mb-1">ランプ</span>
							<div class="flex flex-col gap-2">
								<For each={LAMPS}>
									{(lamp, i) => {
										const id = `filter-lamp-${i()}`;
										return (
											<Checkbox.Root
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
											</Checkbox.Root>
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
		</Dialog.Root>
	);
};

export default FilterDialog;

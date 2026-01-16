import { Checkbox, Dialog, TextField } from "@kobalte/core";
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
	// ローカルコピーで編集し、適用時にonChange
	const [local, setLocal] = createSignal<FilterState>({ ...props.filters });

	// Dialogが開かれた時にフィルター状態をリセット
	const handleOpenChange = (open: boolean) => {
		props.onOpenChange(open);
		if (open) setLocal({ ...props.filters });
	};

	const handleApply = () => {
		props.onChange(local());
		props.onOpenChange(false);
	};

	const handleReset = () => {
		setLocal({
			title: "",
			difficulties: [],
			constMin: null,
			constMax: null,
			scoreMin: null,
			scoreMax: null,
			lamps: [],
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
						{/* 曲名 */}
						<div>
							<label for="filter-title" class="block text-sm font-medium mb-1">
								曲名
							</label>
							<TextField.Root
								value={local().title}
								onChange={(v) => setLocal((prev) => ({ ...prev, title: v }))}
							>
								<TextField.Input
									id="filter-title"
									class="w-full border rounded px-2 py-1"
								/>
							</TextField.Root>
						</div>
						{/* 難易度 */}
						<div>
							<span class="block text-sm font-medium mb-1">難易度</span>
							<div class="flex flex-wrap gap-2">
								<For each={DIFFICULTIES}>
									{(diff, i) => {
										const id = `filter-difficulty-${i()}`;
										return (
											<Checkbox.Root
												checked={local().difficulties.includes(diff)}
												onChange={() =>
													setLocal((prev) => ({
														...prev,
														difficulties: toggleArray(prev.difficulties, diff),
													}))
												}
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
								<label
									for="filter-const-min"
									class="block text-sm font-medium mb-1"
								>
									定数(最小)
								</label>
								<TextField.Root
									value={
										local().constMin !== null ? String(local().constMin) : ""
									}
									onChange={(v) =>
										setLocal((prev) => ({
											...prev,
											constMin: v === "" ? null : Number(v),
										}))
									}
								>
									<TextField.Input
										id="filter-const-min"
										type="number"
										class="w-full border rounded px-2 py-1"
									/>
								</TextField.Root>
							</div>
							<div class="flex-1">
								<label
									for="filter-const-max"
									class="block text-sm font-medium mb-1"
								>
									定数(最大)
								</label>
								<TextField.Root
									value={
										local().constMax !== null ? String(local().constMax) : ""
									}
									onChange={(v) =>
										setLocal((prev) => ({
											...prev,
											constMax: v === "" ? null : Number(v),
										}))
									}
								>
									<TextField.Input
										id="filter-const-max"
										type="number"
										class="w-full border rounded px-2 py-1"
									/>
								</TextField.Root>
							</div>
						</div>
						{/* スコア */}
						<div class="flex gap-2">
							<div class="flex-1">
								<label
									for="filter-score-min"
									class="block text-sm font-medium mb-1"
								>
									スコア(最小)
								</label>
								<TextField.Root
									value={
										local().scoreMin !== null ? String(local().scoreMin) : ""
									}
									onChange={(v) =>
										setLocal((prev) => ({
											...prev,
											scoreMin: v === "" ? null : Number(v),
										}))
									}
								>
									<TextField.Input
										id="filter-score-min"
										type="number"
										class="w-full border rounded px-2 py-1"
									/>
								</TextField.Root>
							</div>
							<div class="flex-1">
								<label
									for="filter-score-max"
									class="block text-sm font-medium mb-1"
								>
									スコア(最大)
								</label>
								<TextField.Root
									value={
										local().scoreMax !== null ? String(local().scoreMax) : ""
									}
									onChange={(v) =>
										setLocal((prev) => ({
											...prev,
											scoreMax: v === "" ? null : Number(v),
										}))
									}
								>
									<TextField.Input
										id="filter-score-max"
										type="number"
										class="w-full border rounded px-2 py-1"
									/>
								</TextField.Root>
							</div>
						</div>
						{/* ランプ */}
						<div>
							<span class="block text-sm font-medium mb-1">ランプ</span>
							<div class="flex flex-wrap gap-2">
								<For each={LAMPS}>
									{(lamp, i) => {
										const id = `filter-lamp-${i()}`;
										return (
											<Checkbox.Root
												checked={local().lamps.includes(lamp)}
												onChange={() =>
													setLocal((prev) => ({
														...prev,
														lamps: toggleArray(prev.lamps, lamp),
													}))
												}
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

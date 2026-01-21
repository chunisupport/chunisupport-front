import { Checkbox } from "@kobalte/core/checkbox";
import { Dialog } from "@kobalte/core/dialog";
import { NumberField } from "@kobalte/core/number-field";
import { RadioGroup } from "@kobalte/core/radio-group";
import { Select } from "@kobalte/core/select";
import { Check, ChevronDown, Info } from "lucide-solid";
import type { Component } from "solid-js";
import { createEffect, createSignal, For } from "solid-js";
import { LAMP_OPTIONS } from "../../../types/filterDefaults";
import { SCORE_RANK_VALUES, SCORE_RANKS } from "../../../utils/scoreRank";
import {
	clearTrackingCondition,
	type SavedFilter,
	saveTrackingCondition,
} from "../../../utils/storage";

type TrackingDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	targetFilter: SavedFilter | null;
	onTrackingSaved: () => void;
};

/** 追跡ランプの選択肢を返す(nullを除外) */
type LampOption = Exclude<(typeof LAMP_OPTIONS)[number], null>;
type LampOptions = LampOption[];
const lampOptionsNotNull = (): LampOptions =>
	LAMP_OPTIONS.filter(
		(lamp): lamp is Exclude<typeof lamp, null> => lamp !== null,
	) as LampOptions;

const TrackingDialog: Component<TrackingDialogProps> = (props) => {
	// 入力値の状態管理
	const [trackingScoreEnabled, setTrackingScoreEnabled] = createSignal(false);
	const [trackingLampEnabled, setTrackingLampEnabled] = createSignal(false);
	const [trackingScoreMode, setTrackingScoreMode] = createSignal<
		"number" | "rank"
	>("rank");
	const [trackingScoreRank, setTrackingScoreRank] = createSignal("SSS");
	const [trackingScoreMin, setTrackingScoreMin] = createSignal<number>(1007500);
	const [trackingLamps, setTrackingLamps] = createSignal<LampOption[]>(
		lampOptionsNotNull(),
	);
	const [trackingLampsRadio, setTrackingLampsRadio] =
		createSignal<LampOption>("ALL JUSTICE");

	// ダイアログが開かれた時に状態を初期化
	createEffect(() => {
		if (!props.open || !props.targetFilter) return;
		clearTrackingCondition();
		setTrackingScoreEnabled(false);
		setTrackingScoreMode("rank");
		setTrackingScoreMin(1007500);
		setTrackingScoreRank("SSS");
		setTrackingLampEnabled(false);
		setTrackingLamps(["ALL JUSTICE", "FULL COMBO"]);
		setTrackingLampsRadio("ALL JUSTICE");
	});

	/** 追跡条件保存処理 */
	const handleSaveTracking = () => {
		const target = props.targetFilter;
		if (!target) return;
		const hasScore = trackingScoreEnabled();
		const hasLamp = trackingLampEnabled();

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
		props.onOpenChange(false);
		props.onTrackingSaved();
	};

	const targetName = () => props.targetFilter?.name ?? "-";
	const canSave = () => trackingScoreEnabled() || trackingLampEnabled();

	return (
		<Dialog open={props.open} onOpenChange={props.onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay class="fixed inset-0 bg-black/30 z-70" />
				<Dialog.Content class="fixed z-80 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-md border border-gray-300">
					<Dialog.Title class="font-bold mb-2">
						追跡条件の設定「{targetName()}」
					</Dialog.Title>
					<Dialog.Description class="text-xs text-gray-500 mb-4">
						<div class="flex items-center p-2 mt-2 border border-lime-400 bg-lime-50 rounded text-lime-800">
							<Info class="w-4 h-4 mr-2 shrink-0" />
							<div class="flex-1">
								目標のスコアやランプ(AJ/FC)を設定することで、レコード画面上部に進捗を表示できます。
							</div>
						</div>
					</Dialog.Description>
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
											onChange={(value: string) => {
												setTrackingScoreMin(Number(value));
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
												onFocus={(event) => event.currentTarget.select()}
												onBlur={(event) =>
													setTrackingScoreMin(Number(event.currentTarget.value))
												}
												disabled={!trackingScoreEnabled()}
											/>
										</NumberField>
									) : (
										<Select
											options={[
												"1点",
												...SCORE_RANKS.filter((rank) => rank !== "0点"),
											]}
											value={trackingScoreRank()}
											onChange={(value) => {
												if (value !== null) {
													setTrackingScoreRank(value);
													if (value === "1点") {
														setTrackingScoreMin(1);
													} else {
														setTrackingScoreMin(
															SCORE_RANK_VALUES[
																value as keyof typeof SCORE_RANK_VALUES
															],
														);
													}
												}
											}}
											class="w-full"
											placeholder="選択…"
											disabled={!trackingScoreEnabled()}
											itemComponent={(itemProps) => (
												<Select.Item
													item={itemProps.item}
													class="text-sm rounded flex items-center justify-between h-8 px-2 outline-none cursor-pointer data-disabled:opacity-50 data-disabled:pointer-events-none data-highlighted:bg-blue-500 data-highlighted:text-white"
												>
													<Select.ItemLabel>
														{itemProps.item.rawValue}
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
								onChange={(value) => setTrackingLampsRadio(value as LampOption)}
								class="flex flex-col mt-2 gap-2"
								disabled={!trackingLampEnabled()}
							>
								<For each={lampOptionsNotNull()}>
									{(lamp, index) => {
										const id = `tracking-lamp-${index()}`;
										return (
											<RadioGroup.Item value={lamp} class="flex items-center">
												<RadioGroup.ItemInput id={id} />
												<RadioGroup.ItemControl class="h-5 w-5 rounded-full border border-gray-300 bg-gray-50 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white flex items-center justify-center mr-2">
													<RadioGroup.ItemIndicator>
														<Check class="h-4 w-4 " />
													</RadioGroup.ItemIndicator>
												</RadioGroup.ItemControl>
												<RadioGroup.ItemLabel
													for={id}
													class={trackingLampEnabled() ? "" : "text-gray-400"}
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
					<div class="text-xs text-gray-500 mt-4">
						追跡設定はブラウザに保存されます。
					</div>
					<div class="flex justify-end gap-2 mt-2">
						<button
							type="button"
							class="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
							onClick={() => props.onOpenChange(false)}
						>
							キャンセル
						</button>
						<button
							type="button"
							class="px-4 py-2 rounded bg-lime-600 text-white hover:bg-lime-700 disabled:opacity-60"
							onClick={handleSaveTracking}
							disabled={!canSave()}
						>
							決定
						</button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog>
	);
};

export default TrackingDialog;

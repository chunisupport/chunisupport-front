import { Checkbox } from "@kobalte/core/checkbox";
import { Dialog } from "@kobalte/core/dialog";
import { NumberField } from "@kobalte/core/number-field";
import { RadioGroup } from "@kobalte/core/radio-group";
import { Select } from "@kobalte/core/select";
import { Check, ChevronDown } from "lucide-solid";
import type { Component } from "solid-js";
import { For } from "solid-js";
import { SCORE_RANKS } from "../../utils/scoreRank";

type TrackingDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	targetName: string;
	trackingScoreEnabled: boolean;
	trackingScoreMode: "number" | "rank";
	trackingScoreMin: number;
	trackingScoreRank: string;
	trackingLampEnabled: boolean;
	trackingLampsRadio: string;
	lampOptions: string[];
	onTrackingScoreEnabledChange: (enabled: boolean) => void;
	onTrackingScoreModeChange: (mode: "number" | "rank") => void;
	onTrackingScoreMinChange: (value: number) => void;
	onTrackingScoreRankChange: (value: string) => void;
	onTrackingLampEnabledChange: (enabled: boolean) => void;
	onTrackingLampsRadioChange: (value: string) => void;
	onSave: () => void;
	canSave: boolean;
};

const TrackingDialog: Component<TrackingDialogProps> = (props) => (
	<Dialog open={props.open} onOpenChange={props.onOpenChange}>
		<Dialog.Portal>
			<Dialog.Overlay class="fixed inset-0 bg-black/30 z-70" />
			<Dialog.Content class="fixed z-80 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-md border border-gray-300">
				<div class="font-bold mb-2">
					追跡条件の設定「{props.targetName}」
				</div>
				<div class="text-xs text-gray-500 mb-4">
					目標とするスコアもしくはランプ(AJ/FC)を設定してください。
				</div>
				<div class="space-y-4">
					<div>
						<Checkbox
							checked={props.trackingScoreEnabled}
							onChange={(checked) => props.onTrackingScoreEnabledChange(checked)}
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
								{props.trackingScoreMode === "number" ? (
									<NumberField
										value={String(props.trackingScoreMin)}
										onChange={(value: string) => {
											props.onTrackingScoreMinChange(Number(value));
										}}
										class="w-full"
										format={false}
										allowedInput={/[0-9.]/}
										step={1}
										disabled={!props.trackingScoreEnabled}
									>
										<NumberField.Input
											id="tracking-score-min"
											min={0}
											max={1010000}
											step={1}
											class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 disabled:bg-gray-100 disabled:text-gray-400"
											onFocus={(event) => event.currentTarget.select()}
											onBlur={(event) =>
												props.onTrackingScoreMinChange(
													Number(event.currentTarget.value),
												)
											}
											disabled={!props.trackingScoreEnabled}
										/>
									</NumberField>
								) : (
									<Select
										options={SCORE_RANKS.filter((rank) => rank !== "0点")}
										value={props.trackingScoreRank}
										onChange={(value) => {
											if (value !== null) props.onTrackingScoreRankChange(value);
										}}
										class="w-full"
										placeholder="選択…"
										disabled={!props.trackingScoreEnabled}
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
								checked={props.trackingScoreMode === "number"}
								onChange={(checked) =>
									props.onTrackingScoreModeChange(checked ? "number" : "rank")
								}
								class="flex items-center"
								disabled={!props.trackingScoreEnabled}
							>
								<Checkbox.Input id="tracing-score-mode" />
								<Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white flex items-center justify-center mr-2">
									<Checkbox.Indicator>
										<Check class="h-4 w-4" />
									</Checkbox.Indicator>
								</Checkbox.Control>
								<Checkbox.Label
									for="tracing-score-mode"
									class={props.trackingScoreEnabled ? "" : "text-gray-400"}
								>
									数値で指定する
								</Checkbox.Label>
							</Checkbox>
						</div>
					</div>
					<div>
						<div class="block text-sm font-medium mb-1">ランプ</div>
						<Checkbox
							checked={props.trackingLampEnabled}
							onChange={(checked) =>
								props.onTrackingLampEnabledChange(checked)
							}
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
							value={props.trackingLampsRadio}
							onChange={(value) => props.onTrackingLampsRadioChange(value)}
							class="flex flex-col mt-2 gap-2"
							disabled={!props.trackingLampEnabled}
						>
							<For each={props.lampOptions}>
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
												class={props.trackingLampEnabled ? "" : "text-gray-400"}
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
						onClick={() => props.onOpenChange(false)}
					>
						キャンセル
					</button>
					<button
						type="button"
						class="px-4 py-2 rounded bg-lime-600 text-white hover:bg-lime-700 disabled:opacity-60"
						onClick={props.onSave}
						disabled={!props.canSave}
					>
						決定
					</button>
				</div>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog>
);

export default TrackingDialog;

import { Dialog } from "@kobalte/core/dialog";
import { Popover } from "@kobalte/core/popover";
import { TextField } from "@kobalte/core/text-field";
import { EllipsisVertical } from "lucide-solid";
import type { Component } from "solid-js";
import { For } from "solid-js";
import type { FilterState } from "../../types/types";
import { formatFilterSummary } from "../../utils/filterDialog";
import type { SavedFilter } from "../../utils/storage";

type SaveDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	filtersList: SavedFilter[];
	saveName: string;
	onSaveNameChange: (value: string) => void;
	onDeleteFilter: (id: string) => void;
	onApplyFilter: (filter: FilterState) => void;
	onStartTracking: (filter: SavedFilter) => void;
	onClearTracking: () => void;
	isTrackingActiveFor: (id: string) => boolean;
	onSaveOnly: () => void;
	onSaveAndTrack: () => void;
};

const SaveDialog: Component<SaveDialogProps> = (props) => (
	<Dialog open={props.open} onOpenChange={props.onOpenChange}>
		<Dialog.Portal>
			<Dialog.Overlay class="fixed inset-0 bg-black/30 z-60" />
			<Dialog.Content class="fixed z-70 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-md border border-gray-300">
				<div class="flex justify-between items-center mb-4">
					<div class="font-bold">フィルター条件の保存・呼出</div>
				</div>
				<div class="mb-4">
					<div class="text-xs text-gray-500 mb-1">保存した条件</div>
					<div class="border border-gray-300 rounded bg-gray-50 px-3 py-2 min-h-80 max-h-80 overflow-y-auto">
						<For each={props.filtersList}>
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
														{formatFilterSummary(item.filter) || "（条件なし）"}
													</div>
												</div>
												<div class="flex justify-end">
													<button
														type="button"
														class="text-red-600 hover:bg-red-100 px-2 py-1 underline"
														onClick={() => props.onDeleteFilter(item.id)}
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
											props.isTrackingActiveFor(item.id)
												? "ml-2 px-2 py-1 rounded border border-lime-600 text-lime-600 hover:bg-lime-100"
												: "ml-2 px-2 py-1 rounded bg-lime-600 border text-white"
										}
										onClick={() =>
											props.isTrackingActiveFor(item.id)
												? props.onClearTracking()
												: props.onStartTracking(item)
										}
									>
										{props.isTrackingActiveFor(item.id) ? "解除" : "追跡"}
									</button>
									<button
										type="button"
										class="ml-2 px-2 py-1 rounded bg-blue-500 text-white text hover:bg-blue-700"
										onClick={() => props.onApplyFilter(item.filter)}
									>
										呼出
									</button>
								</div>
							)}
						</For>
						{props.filtersList.length === 0 && (
							<div class="w-full text-center text-xs text-gray-400 mt-2">
								保存された条件はありません
							</div>
						)}
					</div>
				</div>
				<div class="mb-6">
					<div class="text-xs text-gray-500 mb-1">現在の条件を保存</div>
					<TextField class="mb-2">
						<TextField.Input
							class="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500"
							placeholder="フィルターの名前を入力..."
							value={props.saveName}
							onInput={(event) => props.onSaveNameChange(event.currentTarget.value)}
						/>
					</TextField>
					<div class="flex space-x-2 justify-end">
						<button
							type="button"
							class="px-2 py-1 rounded bg-lime-600 text-white hover:bg-lime-700"
							onClick={props.onSaveAndTrack}
							disabled={!props.saveName.trim()}
						>
							保存して追跡
						</button>
						<button
							type="button"
							class="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
							onClick={props.onSaveOnly}
							disabled={!props.saveName.trim()}
						>
							保存
						</button>
					</div>
				</div>
				<div class="text-right">
					<button
						type="button"
						class="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
						onClick={() => props.onOpenChange(false)}
					>
						戻る
					</button>
				</div>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog>
);

export default SaveDialog;

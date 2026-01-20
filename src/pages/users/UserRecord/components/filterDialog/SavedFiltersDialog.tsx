import { Dialog } from "@kobalte/core/dialog";
import { Popover } from "@kobalte/core/popover";
import { TextField } from "@kobalte/core/text-field";
import { EllipsisVertical } from "lucide-solid";
import type { Component } from "solid-js";
import { createEffect, createSignal, For } from "solid-js";
import type { FilterState } from "../../types/types";
import { formatFilterSummary } from "../../utils/filterDialog";
import {
	clearTrackingCondition,
	deleteFilter,
	loadSavedFilters,
	loadTrackingCondition,
	type SavedFilter,
	saveNewFilter,
} from "../../utils/storage";
import TrackingDialog from "./TrackingDialog";

type SavedFiltersDialogProps = {
	currentFilters: FilterState;
	onApplyFilter: (filter: FilterState) => void;
	onTrackingChange?: () => void;
};

const SavedFiltersDialog: Component<SavedFiltersDialogProps> = (props) => {
	// このダイアログの開閉状態
	const [open, setOpen] = createSignal(false);

	// 保存するフィルターの名前
	const [saveName, setSaveName] = createSignal("");

	// 保存済みフィルターの一覧
	const [filtersList, setFiltersList] = createSignal<SavedFilter[]>(
		loadSavedFilters(),
	);

	// 追跡状態の管理
	const [trackingCondition, setTrackingCondition] = createSignal(
		loadTrackingCondition(),
	);
	const [trackingTargetFilter, setTrackingTargetFilter] =
		createSignal<SavedFilter | null>(null);
	const [trackingDialogOpen, setTrackingDialogOpen] = createSignal(false);

	// 保存ダイアログが開かれたときに追跡の状況を同期
	createEffect(() => {
		if (open()) {
			setTrackingCondition(loadTrackingCondition());
		}
	});

	/** 追跡状態を同期する処理 */
	const syncTrackingState = () => {
		const current = loadTrackingCondition();
		setTrackingCondition(current);
		props.onTrackingChange?.();
	};

	/** 指定のフィルターが追跡中かどうかを返す */
	const isTrackingActiveFor = (id: string) =>
		trackingCondition()?.filterId === id;

	/** 保存済みフィルター適用処理 */
	const handleApplySavedFilter = (filter: FilterState) => {
		props.onApplyFilter(filter);
		setOpen(false);
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

	/** 追跡状態クリア処理 */
	const handleClearTracking = () => {
		clearTrackingCondition();
		syncTrackingState();
	};

	/** 追跡設定ダイアログを開く処理 */
	const openTrackingDialog = (item: SavedFilter) => {
		setTrackingTargetFilter(item);
		setTrackingDialogOpen(true);
	};

	/** 新しいフィルターを保存する処理 */
	const handleSaveNewFilter = ({ track }: { track: boolean }) => {
		const name = saveName().trim();
		if (!name) return;
		const id = saveNewFilter(name, props.currentFilters);
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

	return (
		<>
			<button
				type="button"
				class="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
				onClick={() => setOpen(true)}
			>
				保存・呼出
			</button>
			<Dialog open={open()} onOpenChange={setOpen}>
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
																onClick={() => handleDeleteSavedFilter(item.id)}
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
												onClick={() => handleApplySavedFilter(item.filter)}
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
							<div class="text-xs text-gray-500 mb-1">現在の条件を保存</div>
							<TextField class="mb-2">
								<TextField.Input
									class="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500"
									placeholder="フィルターの名前を入力..."
									value={saveName()}
									onInput={(event) => setSaveName(event.currentTarget.value)}
								/>
							</TextField>
							<div class="flex space-x-2 justify-end">
								<button
									type="button"
									class="px-2 py-1 rounded bg-lime-600 text-white hover:bg-lime-700"
									onClick={() => handleSaveNewFilter({ track: true })}
									disabled={!saveName().trim()}
								>
									保存して追跡
								</button>
								<button
									type="button"
									class="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
									onClick={() => handleSaveNewFilter({ track: false })}
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
								onClick={() => setOpen(false)}
							>
								戻る
							</button>
						</div>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog>
			{/* 追跡設定ダイアログ */}
			<TrackingDialog
				open={trackingDialogOpen()}
				onOpenChange={setTrackingDialogOpen}
				targetFilter={trackingTargetFilter()}
				onTrackingSaved={syncTrackingState}
			/>
		</>
	);
};

export default SavedFiltersDialog;

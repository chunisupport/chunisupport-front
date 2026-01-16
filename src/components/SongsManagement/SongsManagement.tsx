import { AlertDialog } from "@kobalte/core/alert-dialog";
import { Dialog } from "@kobalte/core/dialog";
import { For, Show, createMemo, createResource, createSignal } from "solid-js";

import { deleteSong, fetchSongs } from "../../api/songs";
import { Loading } from "../../components";
import type { ChartDTO, SongDTO } from "../../types/api";

type SongsManagementProps = {
	pageTitle: string;
	description: string;
};

const formatValue = (value: number | string | null | undefined) =>
	value === null || value === undefined || value === "" ? "-" : value;

const getChartCount = (charts: SongDTO["charts"]) =>
	Object.values(charts || {}).filter(Boolean).length;

const SongsManagement = (props: SongsManagementProps) => {
	const [searchText, setSearchText] = createSignal("");
	const [showDeletedOnly, setShowDeletedOnly] = createSignal(false);
	const [actionSong, setActionSong] = createSignal<string | null>(null);
	const [selectedSong, setSelectedSong] = createSignal<SongDTO | null>(null);
	const [detailOpen, setDetailOpen] = createSignal(false);
	const [confirmOpen, setConfirmOpen] = createSignal(false);
	const [confirmAction, setConfirmAction] = createSignal<SongDTO | null>(null);
	const [editTitle, setEditTitle] = createSignal("");
	const [editArtist, setEditArtist] = createSignal("");
	const [editGenre, setEditGenre] = createSignal("");
	const [editBpm, setEditBpm] = createSignal("");
	const [editRelease, setEditRelease] = createSignal("");
	const [editJacket, setEditJacket] = createSignal("");
	const [chartEdits, setChartEdits] = createSignal<Record<string, ChartDTO>>({});
	const [songEdits, setSongEdits] = createSignal<Record<string, Partial<SongDTO>>>(
		{},
	);
	const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

	const [songs, { refetch }] = createResource(fetchSongs);

	const filteredSongs = createMemo(() => {
		const list = (songs()?.songs ?? []).map((song) => ({
			...song,
			...songEdits()[song.id],
		}));
		const filteredByDeleted = showDeletedOnly()
			? list.filter((song) => song.is_deleted)
			: list;
		const query = searchText().trim().toLowerCase();
		if (!query) return filteredByDeleted;
		return filteredByDeleted.filter((song) =>
			[song.id, song.title, song.artist, song.genre]
				.filter(Boolean)
				.some((value) => value.toLowerCase().includes(query)),
		);
	});

	const runAction = async () => {
		const action = confirmAction();
		if (!action || actionSong()) return;
		setActionSong(action.id);
		setErrorMessage(null);
		try {
			await deleteSong(action.id);
			await refetch();
			if (selectedSong()?.id === action.id) {
				setSelectedSong({
					...action,
					is_deleted: true,
				});
			}
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "削除に失敗しました。");
		} finally {
			setActionSong(null);
			setConfirmOpen(false);
		}
	};

	const openEditor = (song: SongDTO) => {
		setSelectedSong(song);
		setEditTitle(song.title);
		setEditArtist(song.artist);
		setEditGenre(song.genre);
		setEditBpm(song.bpm?.toString() ?? "");
		setEditRelease(song.release ?? "");
		setEditJacket(song.jacket ?? "");
		const nextCharts: Record<string, ChartDTO> = {};
		for (const [key, chart] of Object.entries(song.charts || {})) {
			nextCharts[key] = chart ?? {
				const: 0,
				is_const_unknown: false,
				notes: null,
			};
		}
		setChartEdits(nextCharts);
		setDetailOpen(true);
	};

	const handleSave = () => {
		const target = selectedSong();
		if (!target) return;
		const bpmValue = editBpm().trim();
		setSongEdits((prev) => ({
			...prev,
			[target.id]: {
				title: editTitle().trim(),
				artist: editArtist().trim(),
				genre: editGenre().trim(),
				bpm: bpmValue ? Number(bpmValue) : null,
				release: editRelease().trim(),
				jacket: editJacket().trim(),
				charts: { ...chartEdits() },
			},
		}));
		setSelectedSong({
			...target,
			title: editTitle().trim(),
			artist: editArtist().trim(),
			genre: editGenre().trim(),
			bpm: bpmValue ? Number(bpmValue) : null,
			release: editRelease().trim(),
			jacket: editJacket().trim(),
			charts: { ...chartEdits() },
		});
	};

	return (
		<section class="flex flex-col gap-6">
			<header class="space-y-2">
				<h1 class="text-2xl font-semibold text-gray-900">{props.pageTitle}</h1>
				<p class="text-sm text-gray-600">{props.description}</p>
			</header>

			<div class="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
				<div class="flex flex-1 flex-col gap-1">
					<label class="text-sm font-medium text-gray-700" for="song-search">
						楽曲検索
					</label>
					<input
						id="song-search"
						type="text"
						class="rounded-md border border-gray-200 px-3 py-2 text-sm"
						placeholder="タイトル・アーティスト・ID で検索"
						value={searchText()}
						onInput={(event) => setSearchText(event.currentTarget.value)}
					/>
				</div>
				<label class="flex items-center gap-2 text-sm text-gray-700">
					<input
						type="checkbox"
						class="h-4 w-4 rounded border-gray-300"
						checked={showDeletedOnly()}
						onChange={(event) => setShowDeletedOnly(event.currentTarget.checked)}
					/>
					削除済みのみ表示
				</label>
			</div>

			<Show when={errorMessage()}>
				<p class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{errorMessage()}
				</p>
			</Show>
			<Show when={songs.error}>
				<p class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{songs.error instanceof Error
						? songs.error.message
						: "楽曲一覧の取得に失敗しました。"}
				</p>
			</Show>

			<Show when={!songs.loading} fallback={<Loading />}>
				<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
					<table class="min-w-full divide-y divide-gray-200 text-sm">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-4 py-3 text-left font-semibold text-gray-700">
									楽曲
								</th>
								<th class="px-4 py-3 text-left font-semibold text-gray-700">
									アーティスト
								</th>
								<th class="px-4 py-3 text-left font-semibold text-gray-700">
									ジャンル
								</th>
								<th class="px-4 py-3 text-right font-semibold text-gray-700">
									BPM
								</th>
								<th class="px-4 py-3 text-right font-semibold text-gray-700">
									譜面数
								</th>
								<th class="px-4 py-3 text-center font-semibold text-gray-700">
									状態
								</th>
								<th class="px-4 py-3 text-right font-semibold text-gray-700">
									操作
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							<For
								each={filteredSongs()}
								fallback={
									<tr>
										<td
											class="px-4 py-6 text-center text-gray-500"
											colSpan={7}
										>
											{searchText().trim()
												? "検索結果がありません。"
												: "楽曲が存在しません。"}
										</td>
									</tr>
								}
							>
								{(song) => {
									return (
										<tr>
											<td class="px-4 py-3">
												<div class="flex flex-col">
													<span class="font-semibold text-gray-900">
														{song.title}
													</span>
													<span class="text-xs text-gray-500">
														ID: {song.id}
													</span>
												</div>
											</td>
											<td class="px-4 py-3 text-gray-700">
												{formatValue(song.artist)}
											</td>
											<td class="px-4 py-3 text-gray-700">
												{formatValue(song.genre)}
											</td>
											<td class="px-4 py-3 text-right text-gray-700">
												{formatValue(song.bpm)}
											</td>
											<td class="px-4 py-3 text-right text-gray-700">
												{getChartCount(song.charts)}
											</td>
											<td class="px-4 py-3 text-center">
												<span
													class={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
														song.is_deleted
															? "bg-red-100 text-red-700"
															: "bg-green-100 text-green-700"
													}`}
												>
													{song.is_deleted ? "削除済み" : "有効"}
												</span>
											</td>
											<td class="px-4 py-3 text-right">
												<div class="flex flex-wrap justify-end gap-2">
														<button
															type="button"
															class="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
															onClick={() => openEditor(song)}
														>
															編集
														</button>
													</div>
												</td>
										</tr>
									);
								}}
							</For>
						</tbody>
					</table>
				</div>
			</Show>

			<Dialog open={detailOpen()} onOpenChange={setDetailOpen}>
				<Dialog.Portal>
					<Dialog.Overlay class="fixed inset-0 bg-black/40" />
					<Dialog.Content class="fixed left-1/2 top-1/2 w-[min(90vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
						<Show when={selectedSong()}>
							<div class="space-y-4">
								<header class="space-y-1">
									<Dialog.Title class="text-lg font-semibold text-gray-900">
										{selectedSong()!.title} の編集
									</Dialog.Title>
									<p class="text-sm text-gray-600">
										ID: {selectedSong()!.id}
									</p>
								</header>
								<div class="grid gap-3 text-sm text-gray-700">
									<label class="grid gap-1">
										<span class="text-xs text-gray-500">楽曲名</span>
										<input
											type="text"
											class="rounded-md border border-gray-200 px-3 py-2"
											value={editTitle()}
											onInput={(event) => setEditTitle(event.currentTarget.value)}
										/>
									</label>
									<label class="grid gap-1">
										<span class="text-xs text-gray-500">アーティスト</span>
										<input
											type="text"
											class="rounded-md border border-gray-200 px-3 py-2"
											value={editArtist()}
											onInput={(event) => setEditArtist(event.currentTarget.value)}
										/>
									</label>
									<label class="grid gap-1">
										<span class="text-xs text-gray-500">ジャンル</span>
										<input
											type="text"
											class="rounded-md border border-gray-200 px-3 py-2"
											value={editGenre()}
											onInput={(event) => setEditGenre(event.currentTarget.value)}
										/>
									</label>
									<label class="grid gap-1">
										<span class="text-xs text-gray-500">ジャケット</span>
										<input
											type="text"
											class="rounded-md border border-gray-200 px-3 py-2"
											value={editJacket()}
											onInput={(event) => setEditJacket(event.currentTarget.value)}
										/>
									</label>
									<div class="grid grid-cols-2 gap-3">
										<label class="grid gap-1">
											<span class="text-xs text-gray-500">BPM</span>
											<input
												type="number"
												class="rounded-md border border-gray-200 px-3 py-2"
												value={editBpm()}
												onInput={(event) => setEditBpm(event.currentTarget.value)}
											/>
										</label>
										<label class="grid gap-1">
											<span class="text-xs text-gray-500">リリース</span>
											<input
												type="text"
												class="rounded-md border border-gray-200 px-3 py-2"
												value={editRelease()}
												onInput={(event) =>
													setEditRelease(event.currentTarget.value)
												}
											/>
										</label>
									</div>
									<p class="text-xs text-gray-500">
										譜面数: {getChartCount(selectedSong()!.charts)}
									</p>
								</div>
								<div>
									<h3 class="text-sm font-semibold text-gray-700">譜面情報</h3>
									<ul class="mt-2 space-y-2 text-sm text-gray-700">
										<For each={Object.entries(chartEdits())}>
											{([difficulty, chart]) => (
												<li class="rounded-md border border-gray-200 px-3 py-2">
													<div class="flex flex-wrap items-center gap-3">
														<strong class="min-w-[90px]">{difficulty}</strong>
														<label class="flex items-center gap-2 text-xs text-gray-600">
															<input
																type="checkbox"
																class="h-4 w-4 rounded border-gray-300"
																checked={chart.is_const_unknown}
																onChange={(event) =>
																	setChartEdits((prev) => ({
																		...prev,
																		[difficulty]: {
																			...prev[difficulty],
																			is_const_unknown:
																				event.currentTarget.checked,
																		},
																	}))
																}
															/>
															定数未確定
														</label>
														<label class="flex flex-col gap-1 text-xs text-gray-600">
															<span>定数</span>
															<input
																type="number"
																class="w-24 rounded-md border border-gray-200 px-2 py-1 text-sm"
																value={chart.const}
																onInput={(event) =>
																	setChartEdits((prev) => ({
																		...prev,
																		[difficulty]: {
																			...prev[difficulty],
																			const: Number(event.currentTarget.value),
																		},
																	}))
																}
															/>
														</label>
														<label class="flex flex-col gap-1 text-xs text-gray-600">
															<span>ノーツ</span>
															<input
																type="number"
																class="w-24 rounded-md border border-gray-200 px-2 py-1 text-sm"
																value={chart.notes ?? ""}
																onInput={(event) =>
																	setChartEdits((prev) => ({
																		...prev,
																		[difficulty]: {
																			...prev[difficulty],
																			notes: event.currentTarget.value
																				? Number(event.currentTarget.value)
																				: null,
																		},
																	}))
																}
															/>
														</label>
													</div>
												</li>
											)}
										</For>
									</ul>
								</div>
								<div class="flex flex-wrap justify-between gap-2">
									<button
										type="button"
										class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
										onClick={() => {
											setConfirmAction(selectedSong());
											setConfirmOpen(true);
										}}
										disabled={actionSong() === selectedSong()!.id}
									>
										削除
									</button>
									<div class="flex gap-2">
										<Dialog.CloseButton class="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
											閉じる
										</Dialog.CloseButton>
										<button
											type="button"
											class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
											onClick={handleSave}
										>
											保存
										</button>
									</div>
								</div>
							</div>
						</Show>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog>

			<AlertDialog open={confirmOpen()} onOpenChange={setConfirmOpen}>
				<AlertDialog.Portal>
					<AlertDialog.Overlay class="fixed inset-0 bg-black/40" />
					<AlertDialog.Content class="fixed left-1/2 top-1/2 w-[min(90vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
						<div class="space-y-4">
							<header class="space-y-1">
								<AlertDialog.Title class="text-lg font-semibold text-gray-900">
									楽曲削除の確認
								</AlertDialog.Title>
								<AlertDialog.Description class="text-sm text-gray-600">
									{confirmAction()
										? `${confirmAction()!.title} (${confirmAction()!.id}) を削除します。`
										: "対象の楽曲を確認してください。"}
								</AlertDialog.Description>
							</header>
							<div class="flex justify-end gap-2">
								<AlertDialog.CloseButton class="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
									キャンセル
								</AlertDialog.CloseButton>
								<button
									type="button"
									class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
									onClick={runAction}
									disabled={!confirmAction() || actionSong() !== null}
								>
									削除する
								</button>
							</div>
						</div>
					</AlertDialog.Content>
				</AlertDialog.Portal>
			</AlertDialog>
		</section>
	);
};

export default SongsManagement;

import { AlertDialog } from "@kobalte/core/alert-dialog";
import { Dialog } from "@kobalte/core/dialog";
import { For, Show, createMemo, createResource, createSignal } from "solid-js";

import { deleteSong, fetchSongs, restoreSong } from "../../api/songs";
import { Loading } from "../../components";
import type { SongDTO } from "../../types/api";

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
	const [includeDeleted, setIncludeDeleted] = createSignal(false);
	const [actionSong, setActionSong] = createSignal<string | null>(null);
	const [selectedSong, setSelectedSong] = createSignal<SongDTO | null>(null);
	const [detailOpen, setDetailOpen] = createSignal(false);
	const [confirmOpen, setConfirmOpen] = createSignal(false);
	const [confirmAction, setConfirmAction] = createSignal<{
		type: "delete" | "restore";
		song: SongDTO;
	} | null>(null);
	const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

	const [songs, { refetch }] = createResource(includeDeleted, (include) =>
		fetchSongs({ includeDeleted: include }),
	);

	const filteredSongs = createMemo(() => {
		const list = songs()?.songs ?? [];
		const query = searchText().trim().toLowerCase();
		if (!query) return list;
		return list.filter((song) =>
			[song.id, song.title, song.artist, song.genre]
				.filter(Boolean)
				.some((value) => value.toLowerCase().includes(query)),
		);
	});

	const runAction = async () => {
		const action = confirmAction();
		if (!action || actionSong()) return;
		setActionSong(action.song.id);
		setErrorMessage(null);
		try {
			if (action.type === "delete") {
				await deleteSong(action.song.id);
			} else {
				await restoreSong(action.song.id);
			}
			await refetch();
			if (selectedSong()?.id === action.song.id) {
				setSelectedSong({
					...action.song,
					is_deleted: action.type === "delete",
				});
			}
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: action.type === "delete"
						? "削除に失敗しました。"
						: "復活に失敗しました。",
			);
		} finally {
			setActionSong(null);
			setConfirmOpen(false);
		}
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
						checked={includeDeleted()}
						onChange={(event) => setIncludeDeleted(event.currentTarget.checked)}
					/>
					削除済みを含める
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
									const isDeleted = song.is_deleted ?? false;
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
														isDeleted
															? "bg-red-100 text-red-700"
															: "bg-green-100 text-green-700"
													}`}
												>
													{isDeleted ? "削除済み" : "有効"}
												</span>
											</td>
											<td class="px-4 py-3 text-right">
												<div class="flex flex-wrap justify-end gap-2">
													<button
														type="button"
														class="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
														onClick={() => {
															setSelectedSong(song);
															setDetailOpen(true);
														}}
													>
														詳細
													</button>
													{isDeleted ? (
														<button
															type="button"
															class="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
															disabled={actionSong() === song.id}
															onClick={() => {
																setConfirmAction({
																	type: "restore",
																	song,
																});
																setConfirmOpen(true);
															}}
														>
															復活
														</button>
													) : (
														<button
															type="button"
															class="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
															disabled={actionSong() === song.id}
															onClick={() => {
																setConfirmAction({
																	type: "delete",
																	song,
																});
																setConfirmOpen(true);
															}}
														>
															削除
														</button>
													)}
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
										{selectedSong()!.title} の詳細
									</Dialog.Title>
									<p class="text-sm text-gray-600">
										ID: {selectedSong()!.id}
									</p>
								</header>
								<div class="grid gap-2 text-sm text-gray-700">
									<p>アーティスト: {formatValue(selectedSong()!.artist)}</p>
									<p>ジャンル: {formatValue(selectedSong()!.genre)}</p>
									<p>BPM: {formatValue(selectedSong()!.bpm)}</p>
									<p>リリース: {formatValue(selectedSong()!.release)}</p>
									<p>譜面数: {getChartCount(selectedSong()!.charts)}</p>
								</div>
								<div>
									<h3 class="text-sm font-semibold text-gray-700">譜面情報</h3>
									<ul class="mt-2 space-y-2 text-sm text-gray-700">
										<For each={Object.entries(selectedSong()!.charts || {})}>
											{([difficulty, chart]) => (
												<li class="rounded-md border border-gray-200 px-3 py-2">
													<strong class="mr-2">{difficulty}</strong>
													{chart
														? `定数 ${chart.const} / ノーツ ${formatValue(chart.notes)}`
														: "譜面なし"}
												</li>
											)}
										</For>
									</ul>
								</div>
								<div class="flex justify-end">
									<Dialog.CloseButton class="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
										閉じる
									</Dialog.CloseButton>
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
									{confirmAction()?.type === "delete"
										? "楽曲削除の確認"
										: "楽曲復活の確認"}
								</AlertDialog.Title>
								<AlertDialog.Description class="text-sm text-gray-600">
									{confirmAction()
										? `${confirmAction()!.song.title} (${confirmAction()!.song.id}) を${
												confirmAction()!.type === "delete" ? "削除" : "復活"
										  }します。`
										: "対象の楽曲を確認してください。"}
								</AlertDialog.Description>
							</header>
							<div class="flex justify-end gap-2">
								<AlertDialog.CloseButton class="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
									キャンセル
								</AlertDialog.CloseButton>
								<button
									type="button"
									class={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
										confirmAction()?.type === "delete"
											? "bg-red-600 hover:bg-red-700"
											: "bg-green-600 hover:bg-green-700"
									}`}
									onClick={runAction}
									disabled={!confirmAction() || actionSong() !== null}
								>
									{confirmAction()?.type === "delete" ? "削除する" : "復活する"}
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

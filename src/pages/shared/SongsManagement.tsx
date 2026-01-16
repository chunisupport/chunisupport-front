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

	const handleDelete = async (song: SongDTO) => {
		if (actionSong()) return;
		const ok = window.confirm(
			`${song.title} (${song.id}) を削除します。よろしいですか？`,
		);
		if (!ok) return;

		setActionSong(song.id);
		setErrorMessage(null);
		try {
			await deleteSong(song.id);
			await refetch();
			if (selectedSong()?.id === song.id) {
				setSelectedSong({ ...song, is_deleted: true });
			}
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "削除に失敗しました。",
			);
		} finally {
			setActionSong(null);
		}
	};

	const handleRestore = async (song: SongDTO) => {
		if (actionSong()) return;
		const ok = window.confirm(
			`${song.title} (${song.id}) を復活します。よろしいですか？`,
		);
		if (!ok) return;

		setActionSong(song.id);
		setErrorMessage(null);
		try {
			await restoreSong(song.id);
			await refetch();
			if (selectedSong()?.id === song.id) {
				setSelectedSong({ ...song, is_deleted: false });
			}
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "復活に失敗しました。",
			);
		} finally {
			setActionSong(null);
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
														onClick={() => setSelectedSong(song)}
													>
														詳細
													</button>
													{isDeleted ? (
														<button
															type="button"
															class="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
															disabled={actionSong() === song.id}
															onClick={() => handleRestore(song)}
														>
															復活
														</button>
													) : (
														<button
															type="button"
															class="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
															disabled={actionSong() === song.id}
															onClick={() => handleDelete(song)}
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

			<Show when={selectedSong()}>
				<div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 class="text-lg font-semibold text-gray-900">
								{selectedSong()!.title} の詳細
							</h2>
							<p class="text-sm text-gray-600">ID: {selectedSong()!.id}</p>
						</div>
						<button
							type="button"
							class="rounded-md border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50"
							onClick={() => setSelectedSong(null)}
						>
							閉じる
						</button>
					</div>
					<div class="mt-4 grid gap-3 text-sm text-gray-700">
						<p>アーティスト: {formatValue(selectedSong()!.artist)}</p>
						<p>ジャンル: {formatValue(selectedSong()!.genre)}</p>
						<p>BPM: {formatValue(selectedSong()!.bpm)}</p>
						<p>リリース: {formatValue(selectedSong()!.release)}</p>
						<p>譜面数: {getChartCount(selectedSong()!.charts)}</p>
					</div>
					<div class="mt-4">
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
				</div>
			</Show>
		</section>
	);
};

export default SongsManagement;

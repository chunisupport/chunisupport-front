import { AlertDialog } from "@kobalte/core/alert-dialog";
import { Dialog } from "@kobalte/core/dialog";
import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { For, Show, createMemo, createResource, createSignal } from "solid-js";

import { deleteAdminUser, fetchAdminUsers, restoreAdminUser } from "../../api/admin";
import { Loading, RoleGate } from "../../components";
import type { UserListResponse } from "../../types/api";

const AdminUsersPage = () => {
	const [searchText, setSearchText] = createSignal("");
	const [filters, setFilters] = createSignal({ name: "" });
	const [actionUser, setActionUser] = createSignal<string | null>(null);
	const [selectedUser, setSelectedUser] = createSignal<UserListResponse | null>(null);
	const [detailOpen, setDetailOpen] = createSignal(false);
	const [deleteTarget, setDeleteTarget] = createSignal<UserListResponse | null>(null);
	const [deleteOpen, setDeleteOpen] = createSignal(false);
	const [restoreUsername, setRestoreUsername] = createSignal("");
	const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

	const [users, { refetch }] = createResource(filters, (params) =>
		fetchAdminUsers({ name: params.name || undefined }),
	);

	const hasActiveSearch = createMemo(() => Boolean(filters().name));

	const handleSearch = (event: SubmitEvent) => {
		event.preventDefault();
		setFilters({ name: searchText().trim() });
	};

	const handleClear = () => {
		setSearchText("");
		setFilters({ name: "" });
	};

	const confirmDelete = async () => {
		const target = deleteTarget();
		if (!target || actionUser()) return;
		setActionUser(target.username);
		setErrorMessage(null);
		try {
			await deleteAdminUser(target.username);
			await refetch();
			if (selectedUser()?.username === target.username) {
				setSelectedUser(null);
				setDetailOpen(false);
			}
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "削除に失敗しました。",
			);
		} finally {
			setActionUser(null);
			setDeleteOpen(false);
		}
	};

	const handleRestore = async (event: SubmitEvent) => {
		event.preventDefault();
		const username = restoreUsername().trim();
		if (!username || actionUser()) return;
		setActionUser(username);
		setErrorMessage(null);
		try {
			await restoreAdminUser(username);
			await refetch();
			setRestoreUsername("");
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "復活に失敗しました。",
			);
		} finally {
			setActionUser(null);
		}
	};

	return (
		<RoleGate allowedRoles={["ADMIN"]}>
			<section class="flex flex-col gap-6">
				<Title>ユーザー管理 - Chunisupport</Title>
				<header class="space-y-2">
					<h1 class="text-2xl font-semibold text-gray-900">ユーザー管理</h1>
					<p class="text-sm text-gray-600">
						ユーザー検索、編集、削除、復活を行います。
					</p>
				</header>

				<form
					onSubmit={handleSearch}
					class="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
				>
					<div class="flex flex-1 flex-col gap-1">
						<label class="text-sm font-medium text-gray-700" for="admin-user-search">
							ユーザー検索
						</label>
						<input
							id="admin-user-search"
							type="text"
							class="rounded-md border border-gray-200 px-3 py-2 text-sm"
							placeholder="ユーザー名またはプレイヤー名"
							value={searchText()}
							onInput={(event) => setSearchText(event.currentTarget.value)}
						/>
					</div>
					<div class="flex gap-2">
						<button
							type="submit"
							class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
						>
							検索
						</button>
						<button
							type="button"
							class="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
							onClick={handleClear}
						>
							クリア
						</button>
					</div>
				</form>

				<form
					onSubmit={handleRestore}
					class="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
				>
					<div class="flex flex-1 flex-col gap-1">
						<label
							class="text-sm font-medium text-gray-700"
							for="admin-user-restore"
						>
							ユーザー復活
						</label>
						<input
							id="admin-user-restore"
							type="text"
							class="rounded-md border border-gray-200 px-3 py-2 text-sm"
							placeholder="復活したいユーザー名"
							value={restoreUsername()}
							onInput={(event) => setRestoreUsername(event.currentTarget.value)}
						/>
					</div>
					<button
						type="submit"
						class="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
						disabled={!restoreUsername().trim() || actionUser() !== null}
					>
						復活
					</button>
				</form>

				<Show when={errorMessage()}>
					<p class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{errorMessage()}
					</p>
				</Show>
				<Show when={users.error}>
					<p class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{users.error instanceof Error
							? users.error.message
							: "ユーザー一覧の取得に失敗しました。"}
					</p>
				</Show>

				<Show when={!users.loading} fallback={<Loading />}>
					<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
						<table class="min-w-full divide-y divide-gray-200 text-sm">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-4 py-3 text-left font-semibold text-gray-700">
										ユーザー
									</th>
									<th class="px-4 py-3 text-left font-semibold text-gray-700">
										プレイヤー名
									</th>
									<th class="px-4 py-3 text-right font-semibold text-gray-700">
										レーティング
									</th>
									<th class="px-4 py-3 text-right font-semibold text-gray-700">
										OVERPOWER
									</th>
									<th class="px-4 py-3 text-right font-semibold text-gray-700">
										操作
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200">
								<For
									each={users()}
									fallback={
										<tr>
											<td
												class="px-4 py-6 text-center text-gray-500"
												colSpan={5}
											>
												{hasActiveSearch()
													? "検索結果がありません。"
													: "ユーザーが存在しません。"}
											</td>
										</tr>
									}
								>
									{(user) => (
										<tr>
											<td class="px-4 py-3">
												<div class="flex flex-col">
													<A
														href={`/users/${encodeURIComponent(user.username)}`}
														class="font-semibold text-blue-600 hover:underline"
													>
														{user.username}
													</A>
												</div>
											</td>
											<td class="px-4 py-3 text-gray-700">
												{user.player_name || "未連携"}
											</td>
											<td class="px-4 py-3 text-right text-gray-700">
												{user.rating?.toFixed(2) ?? "-"}
											</td>
											<td class="px-4 py-3 text-right text-gray-700">
												{user.overpower_value?.toFixed(2) ?? "-"}
											</td>
											<td class="px-4 py-3 text-right">
												<div class="flex flex-wrap justify-end gap-2">
													<button
														type="button"
														class="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
														onClick={() => {
															setSelectedUser(user);
															setDetailOpen(true);
														}}
													>
														詳細
													</button>
													<button
														type="button"
														class="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
														disabled={actionUser() === user.username}
														onClick={() => {
															setDeleteTarget(user);
															setDeleteOpen(true);
														}}
													>
														削除
													</button>
												</div>
											</td>
										</tr>
									)}
								</For>
							</tbody>
						</table>
					</div>
				</Show>

				<Dialog open={detailOpen()} onOpenChange={setDetailOpen}>
					<Dialog.Portal>
						<Dialog.Overlay class="fixed inset-0 bg-black/40" />
						<Dialog.Content class="fixed left-1/2 top-1/2 w-[min(90vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
							<Show when={selectedUser()}>
								<div class="space-y-4">
									<header class="space-y-1">
										<Dialog.Title class="text-lg font-semibold text-gray-900">
											{selectedUser()!.username} の詳細
										</Dialog.Title>
										<p class="text-sm text-gray-600">
											APIで取得できる情報を表示しています。
										</p>
									</header>
									<div class="space-y-2 text-sm text-gray-700">
										<p>
											プレイヤー名: {selectedUser()!.player_name || "未連携"}
										</p>
										<p>レーティング: {selectedUser()!.rating ?? "-"}</p>
										<p>
											OVERPOWER: {selectedUser()!.overpower_value ?? "-"}
										</p>
									</div>
									<div class="flex justify-end gap-2">
										<Dialog.CloseButton class="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
											閉じる
										</Dialog.CloseButton>
									</div>
								</div>
							</Show>
						</Dialog.Content>
					</Dialog.Portal>
				</Dialog>

				<AlertDialog open={deleteOpen()} onOpenChange={setDeleteOpen}>
					<AlertDialog.Portal>
						<AlertDialog.Overlay class="fixed inset-0 bg-black/40" />
						<AlertDialog.Content class="fixed left-1/2 top-1/2 w-[min(90vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
							<div class="space-y-4">
								<header class="space-y-1">
									<AlertDialog.Title class="text-lg font-semibold text-gray-900">
										ユーザー削除の確認
									</AlertDialog.Title>
									<AlertDialog.Description class="text-sm text-gray-600">
										{deleteTarget()
											? `${deleteTarget()!.username} を削除します。`
											: "削除対象のユーザーを確認してください。"}
									</AlertDialog.Description>
								</header>
								<div class="flex justify-end gap-2">
									<AlertDialog.CloseButton class="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
										キャンセル
									</AlertDialog.CloseButton>
									<button
										type="button"
										class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
										onClick={confirmDelete}
										disabled={!deleteTarget() || actionUser() !== null}
									>
										削除する
									</button>
								</div>
							</div>
						</AlertDialog.Content>
					</AlertDialog.Portal>
				</AlertDialog>
			</section>
		</RoleGate>
	);
};

export default AdminUsersPage;

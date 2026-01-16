import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { For, Show, createMemo, createResource, createSignal } from "solid-js";

import { deleteAdminUser, fetchAdminUsers, restoreAdminUser } from "../../api/admin";
import { Loading, RoleGate } from "../../components";
import type { AdminUserListResponse } from "../../types/api";

const AdminUsersPage = () => {
	const [searchText, setSearchText] = createSignal("");
	const [filters, setFilters] = createSignal({ page: 1, name: "" });
	const [actionUser, setActionUser] = createSignal<string | null>(null);
	const [selectedUser, setSelectedUser] = createSignal<AdminUserListResponse | null>(
		null,
	);
	const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

	const [users, { refetch }] = createResource(filters, (params) =>
		fetchAdminUsers({ page: params.page, name: params.name || undefined }),
	);

	const hasActiveSearch = createMemo(() => Boolean(filters().name));

	const handleSearch = (event: SubmitEvent) => {
		event.preventDefault();
		setFilters({ page: 1, name: searchText().trim() });
	};

	const handleClear = () => {
		setSearchText("");
		setFilters({ page: 1, name: "" });
	};

	const handleDelete = async (user: AdminUserListResponse) => {
		if (actionUser()) return;
		const ok = window.confirm(
			`${user.username} を削除します。よろしいですか？`,
		);
		if (!ok) return;

		setActionUser(user.username);
		setErrorMessage(null);
		try {
			await deleteAdminUser(user.username);
			await refetch();
			if (selectedUser()?.username === user.username) {
				setSelectedUser({ ...user, is_deleted: true });
			}
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "削除に失敗しました。",
			);
		} finally {
			setActionUser(null);
		}
	};

	const handleRestore = async (user: AdminUserListResponse) => {
		if (actionUser()) return;
		const ok = window.confirm(
			`${user.username} を復活します。よろしいですか？`,
		);
		if (!ok) return;

		setActionUser(user.username);
		setErrorMessage(null);
		try {
			await restoreAdminUser(user.username);
			await refetch();
			if (selectedUser()?.username === user.username) {
				setSelectedUser({ ...user, is_deleted: false });
			}
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "復活に失敗しました。",
			);
		} finally {
			setActionUser(null);
		}
	};

	const goToPage = (page: number) => {
		setFilters((prev) => ({ ...prev, page }));
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
									each={users()}
									fallback={
										<tr>
											<td
												class="px-4 py-6 text-center text-gray-500"
												colSpan={6}
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
													<span class="text-xs text-gray-500">
														{user.is_private ? "非公開" : "公開"}
													</span>
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
											<td class="px-4 py-3 text-center">
												<span
													class={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
														user.is_deleted
															? "bg-red-100 text-red-700"
															: "bg-green-100 text-green-700"
													}`}
												>
													{user.is_deleted ? "削除済み" : "有効"}
												</span>
											</td>
											<td class="px-4 py-3 text-right">
												<div class="flex flex-wrap justify-end gap-2">
													<button
														type="button"
														class="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
														onClick={() => setSelectedUser(user)}
													>
														編集
													</button>
													{user.is_deleted ? (
														<button
															type="button"
															class="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
															disabled={actionUser() === user.username}
															onClick={() => handleRestore(user)}
														>
															復活
														</button>
													) : (
														<button
															type="button"
															class="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
															disabled={actionUser() === user.username}
															onClick={() => handleDelete(user)}
														>
															削除
														</button>
													)}
												</div>
											</td>
										</tr>
									)}
								</For>
							</tbody>
						</table>
					</div>

					<div class="flex items-center justify-between text-sm text-gray-600">
						<button
							type="button"
							class="rounded-md border border-gray-200 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50"
							disabled={filters().page <= 1}
							onClick={() => goToPage(filters().page - 1)}
						>
							前へ
						</button>
						<span>ページ {filters().page}</span>
						<button
							type="button"
							class="rounded-md border border-gray-200 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50"
							onClick={() => goToPage(filters().page + 1)}
							disabled={users()?.length === 0}
						>
							次へ
						</button>
					</div>
				</Show>

				<Show when={selectedUser()}>
					<div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h2 class="text-lg font-semibold text-gray-900">
									{selectedUser()!.username} の編集
								</h2>
								<p class="text-sm text-gray-600">
									APIで提供されている範囲の操作のみ実行できます。
								</p>
							</div>
							<button
								type="button"
								class="rounded-md border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50"
								onClick={() => setSelectedUser(null)}
							>
								閉じる
							</button>
						</div>
						<div class="mt-4 grid gap-3 text-sm text-gray-700">
							<p>
								プレイヤー名: {selectedUser()!.player_name || "未連携"}
							</p>
							<p>
								公開設定: {selectedUser()!.is_private ? "非公開" : "公開"}
							</p>
							<p>
								削除状態: {selectedUser()!.is_deleted ? "削除済み" : "有効"}
							</p>
						</div>
					</div>
				</Show>
			</section>
		</RoleGate>
	);
};

export default AdminUsersPage;

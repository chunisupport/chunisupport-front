import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";

import { RoleGate } from "../../components";

const AdminPage = () => {
	return (
		<RoleGate allowedRoles={["ADMIN"]}>
			<section class="flex flex-col gap-6">
				<Title>管理メニュー - Chunisupport</Title>
				<header class="space-y-2">
					<h1 class="text-2xl font-semibold text-gray-900">管理メニュー</h1>
					<p class="text-sm text-gray-600">
						ユーザー管理や楽曲管理への入口です。
					</p>
				</header>
				<div class="grid gap-4 sm:grid-cols-2">
					<A
						href="/admin/users"
						class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow"
					>
						<h2 class="text-lg font-semibold text-gray-900">ユーザー管理</h2>
						<p class="text-sm text-gray-600">
							検索・削除・復活などの操作を行います。
						</p>
					</A>
					<A
						href="/admin/songs"
						class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow"
					>
						<h2 class="text-lg font-semibold text-gray-900">楽曲管理</h2>
						<p class="text-sm text-gray-600">
							楽曲追加・編集フローの準備状況を確認します。
						</p>
					</A>
				</div>
			</section>
		</RoleGate>
	);
};

export default AdminPage;

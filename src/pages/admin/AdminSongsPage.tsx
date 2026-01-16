import { Title } from "@solidjs/meta";

import { RoleGate } from "../../components";

const AdminSongsPage = () => {
	return (
		<RoleGate allowedRoles={["ADMIN"]}>
			<section class="flex flex-col gap-6">
				<Title>楽曲管理 - Chunisupport</Title>
				<header class="space-y-2">
					<h1 class="text-2xl font-semibold text-gray-900">楽曲管理</h1>
					<p class="text-sm text-gray-600">
						楽曲の追加・編集・削除・復活などの機能を実装予定です。
					</p>
				</header>
				<div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
					<ul class="list-disc space-y-2 pl-5 text-sm text-gray-700">
						<li>楽曲一覧表示（WORLD&apos;S END を除く）</li>
						<li>追加・編集・削除・復活の一括操作</li>
						<li>WORLD&apos;S END 楽曲の管理</li>
					</ul>
				</div>
			</section>
		</RoleGate>
	);
};

export default AdminSongsPage;

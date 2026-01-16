import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";

import { RoleGate } from "../../components";

const EditorPage = () => {
	return (
		<RoleGate allowedRoles={["ADMIN", "EDITOR"]}>
			<section class="flex flex-col gap-6">
				<Title>編集メニュー - Chunisupport</Title>
				<header class="space-y-2">
					<h1 class="text-2xl font-semibold text-gray-900">編集メニュー</h1>
					<p class="text-sm text-gray-600">
						編集者向けの楽曲管理メニューです。
					</p>
				</header>
				<div class="grid gap-4 sm:grid-cols-2">
					<A
						href="/editor/songs"
						class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow"
					>
						<h2 class="text-lg font-semibold text-gray-900">楽曲管理</h2>
						<p class="text-sm text-gray-600">
							楽曲の追加・編集フローを準備中です。
						</p>
					</A>
				</div>
			</section>
		</RoleGate>
	);
};

export default EditorPage;

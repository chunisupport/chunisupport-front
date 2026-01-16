import { A } from "@solidjs/router";
import type { JSX } from "solid-js";
import { createResource, Show } from "solid-js";

import { fetchMe } from "../../api/users";
import type { UserDTO } from "../../types/api";
import { Loading } from "../Loading";

const roleLabelMap: Record<NonNullable<UserDTO["account_type"]>, string> = {
	PLAYER: "プレイヤー",
	EDITOR: "編集者",
	ADMIN: "管理者",
};

type RoleGateProps = {
	allowedRoles: NonNullable<UserDTO["account_type"]>[];
	children: JSX.Element;
};

const RoleGate = (props: RoleGateProps) => {
	const [me] = createResource(fetchMe);

	const accountType = () => me()?.account_type;
	const isAuthorized = () =>
		accountType() && props.allowedRoles.includes(accountType()!);

	return (
		<Show when={!me.loading} fallback={<Loading />}>
			<Show
				when={!me.error && isAuthorized()}
				fallback={
					<div class="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
						<h1 class="text-xl font-semibold text-gray-900">
							アクセス制限
						</h1>
						<p class="text-sm text-gray-600">
							{me.error
								? "ログインが必要です。権限のあるアカウントでログインしてください。"
								: "このページにアクセスする権限がありません。"}
						</p>
						<Show when={!me.error && accountType()}>
							<p class="text-sm text-gray-600">
								現在の権限: {roleLabelMap[accountType()!]}
							</p>
						</Show>
						<div class="flex flex-wrap gap-3">
							<A
								class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
								href="/login"
							>
								ログインへ
							</A>
							<A
								class="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
								href="/"
							>
								トップへ戻る
							</A>
						</div>
					</div>
				}
			>
				{props.children}
			</Show>
		</Show>
	);
};

export default RoleGate;

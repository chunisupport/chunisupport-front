import { Collapsible } from "@kobalte/core/collapsible";
import { TextField } from "@kobalte/core/text-field";
import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { createSignal, onMount } from "solid-js";

import { postLogin } from "../../../api/auth";
import { fetchMe } from "../../../api/users";

const Login = () => {
	const navigate = useNavigate();
	const [username, setUsername] = createSignal("");
	const [password, setPassword] = createSignal("");
	const [errorMessage, setErrorMessage] = createSignal("");
	const [isSubmitting, setIsSubmitting] = createSignal(false);

	// すでにログインしている場合はユーザーページへリダイレクト
	onMount(async () => {
		try {
			const user = await fetchMe();
			navigate(`/users/${user.username}`);
		} catch (error) {
			console.error("Failed to fetch user info:", error);
		}
	});

	// 管理者ログイン処理
	const handleLogin = async () => {
		if (!username() || !password()) {
			setErrorMessage("データ1とデータ2を入力してください。");
			return;
		}

		setIsSubmitting(true);
		setErrorMessage("");
		try {
			await postLogin({ username: username(), password: password() });
			navigate(`/users/${encodeURIComponent(username())}`);
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "ログインに失敗しました。",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div class="min-h-screen flex px-4 py-10">
			<Title>ログイン - ChuniSupport</Title>
			<div class="w-full max-w-md">
				<div class="text-center mb-6">
					<h1 class="text-2xl font-semibold">ログイン</h1>
				</div>

				{/* TODO: Googleログインを実装 */}
				<div class="mb-6">
					<button
						type="button"
						class="w-full px-4 py-2 rounded-md border border-gray-300"
					>
						ぐーぐるでろぐいんするぼたん
					</button>
				</div>

				{/* 管理者用 */}
				<div class="mb-6">
					<Collapsible>
						<Collapsible.Trigger class="text-sm text-blue-500 underline">
							管理者用ログイン
						</Collapsible.Trigger>
						<Collapsible.Content class="mt-4">
							<TextField>
								<TextField.Input
									class="mb-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="データ1"
									value={username()}
									onInput={(event) => setUsername(event.currentTarget.value)}
								/>
								<TextField.Input
									class="mb-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="データ2"
									type="password"
									value={password()}
									onInput={(event) => setPassword(event.currentTarget.value)}
								/>
							</TextField>
							{errorMessage() && (
								<p class="text-sm text-red-600 mb-2">{errorMessage()}</p>
							)}
							<button
								type="button"
								class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
								onClick={handleLogin}
								disabled={isSubmitting()}
							>
								{isSubmitting() ? "実行中..." : "実行"}
							</button>
						</Collapsible.Content>
					</Collapsible>
				</div>
			</div>
		</div>
	);
};

export default Login;

import { Checkbox } from "@kobalte/core/checkbox";
import { TextField } from "@kobalte/core/text-field";
import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { Check } from "lucide-solid";
import { createSignal } from "solid-js";

import useRedirectIfAuthenticated from "../../../hooks/useRedirectIfAuthenticated";

const Register = () => {
	const navigate = useNavigate();
	const [username, setUsername] = createSignal("");
	const [password, setPassword] = createSignal("");
	const [passwordConfirm, setPasswordConfirm] = createSignal("");
	const [errorMessage, setErrorMessage] = createSignal("");
	const [isSubmitting, setIsSubmitting] = createSignal(false);
	const [agreedToTerms, setAgreedToTerms] = createSignal(false);

	// すでにログインしている場合はユーザーページへリダイレクト
	useRedirectIfAuthenticated();

	// バリデーション
	const validate = () => {
		if (!username()) return "ユーザーIDを入力してください。";
		if (username().length < 5)
			return "ユーザーIDは5文字以上で入力してください。";
		if (username().length > 50)
			return "ユーザーIDは50文字以内で入力してください。";
		if (!/^[a-z0-9]+$/.test(username()))
			return "ユーザーIDは小文字の英数字のみ使用できます。";
		if (!password()) return "パスワードを入力してください。";
		if (password().length < 8)
			return "パスワードは8文字以上で入力してください。";
		if (password().length > 128)
			return "パスワードは128文字以内で入力してください。";
		if (password() !== passwordConfirm()) return "パスワードが一致しません。";
		if (!agreedToTerms()) return "利用規約に同意してください。";
		return "";
	};

	// 新規登録処理
	const handleRegister = async () => {
		const err = validate();
		if (err) {
			setErrorMessage(err);
			return;
		}

		setIsSubmitting(true);
		setErrorMessage("");
		try {
			// postRegisterは自動でログイン状態になる
			await import("../../../api/auth").then(({ postRegister }) =>
				postRegister({ username: username(), password: password() }),
			);
			navigate(`/users/${encodeURIComponent(username())}`);
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "登録に失敗しました。",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div class="min-h-screen flex justify-center px-4 py-10">
			<Title>新規登録 - ChuniSupport</Title>
			<div class="w-full max-w-md">
				<div class="text-center mb-6">
					<p class="text-gray-600 mb-2">Chunisupport</p>
					<h1 class="text-2xl font-semibold">新規登録</h1>
				</div>

				{/* 注意事項 */}
				<div class="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
					<p class="text-yellow-800 text-sm">
						スコアデータの登録には ゲキチュウマイ-NET利用権が必要です。
					</p>
				</div>

				{/* 入力フォーム */}
				<div class="mb-6 text-center">
					<TextField>
						<TextField.Input
							class="mb-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="新規ユーザーID (英数字)"
							value={username()}
							onInput={(event) => setUsername(event.currentTarget.value)}
						/>
						<TextField.Input
							class="mb-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="パスワード"
							type="password"
							value={password()}
							onInput={(event) => setPassword(event.currentTarget.value)}
						/>
						<TextField.Input
							class="mb-4 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="パスワード（確認）"
							type="password"
							value={passwordConfirm()}
							onInput={(event) => setPasswordConfirm(event.currentTarget.value)}
						/>
					</TextField>
					{/* 利用規約 */}
					<Checkbox class="flex items-center mb-3">
						<Checkbox.Input
							class="sr-only"
							checked={agreedToTerms()}
							onChange={(e) => setAgreedToTerms(e.currentTarget.checked)}
						/>
						<Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50  data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white flex items-center justify-center">
							<Checkbox.Indicator>
								<Check class="h-4 w-4" />
							</Checkbox.Indicator>
						</Checkbox.Control>
						<Checkbox.Label class="ml-2 text-gray-900 text-sm select-none">
							<a href="/terms" class="text-blue-500 underline mr-1">
								利用規約
							</a>
							に同意します
						</Checkbox.Label>
					</Checkbox>
					{errorMessage() && (
						<p class="text-sm text-red-600 mb-2">{errorMessage()}</p>
					)}
					<button
						type="button"
						class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
						onClick={handleRegister}
						disabled={isSubmitting()}
					>
						{isSubmitting() ? "処理中..." : "登録"}
					</button>
				</div>

				<div class="text-center">
					<p class="mb-5 text-sm text-gray-600">
						すでにアカウントをお持ちの方は
						<a href="/login" class="text-blue-500 underline ml-1">
							こちら
						</a>
					</p>
					<p class="text-sm text-gray-600">
						<a href="/" class="text-blue-500 underline ml-1">
							トップページへ戻る
						</a>
					</p>
				</div>
			</div>
		</div>
	);
};

export default Register;

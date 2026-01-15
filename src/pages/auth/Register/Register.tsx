import { Checkbox } from "@kobalte/core/checkbox";
import { TextField } from "@kobalte/core/text-field";
import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { Check } from "lucide-solid";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { checkUsernameAvailability } from "../../../api/auth";

import useRedirectIfAuthenticated from "../../../hooks/useRedirectIfAuthenticated";

const Register = () => {
	const navigate = useNavigate();
	const [username, setUsername] = createSignal("");
	const [password, setPassword] = createSignal("");
	const [passwordConfirm, setPasswordConfirm] = createSignal("");
	const [errorMessage, setErrorMessage] = createSignal("");
	const [isSubmitting, setIsSubmitting] = createSignal(false);
	const [agreedToTerms, setAgreedToTerms] = createSignal(false);

	// バリデーション・重複チェック用Signal
	const [usernameError, setUsernameError] = createSignal("");
	const [passwordError, setPasswordError] = createSignal("");
	const [passwordConfirmError, setPasswordConfirmError] = createSignal("");
	const [usernameAvailable, setUsernameAvailable] = createSignal<
		boolean | null
	>(null);
	const [isCheckingUsername, setIsCheckingUsername] = createSignal(false);

	// ユーザー名のリアルタイムバリデーション＆重複チェック（デバウンス付き）
	createEffect(() => {
		const user = username();
		if (!user) {
			setUsernameError("");
			setUsernameAvailable(null);
			return;
		}
		// バリデーション
		if (user.length < 5) {
			setUsernameError("ユーザーIDは5文字以上で入力してください。");
			setUsernameAvailable(null);
			return;
		}
		if (user.length > 50) {
			setUsernameError("ユーザーIDは50文字以内で入力してください。");
			setUsernameAvailable(null);
			return;
		}
		if (!/^[a-z0-9]+$/.test(user)) {
			setUsernameError("ユーザーIDは小文字の英数字のみ使用できます。");
			setUsernameAvailable(null);
			return;
		}
		setUsernameError("");
		setIsCheckingUsername(true);
		const timer = setTimeout(async () => {
			try {
				const available = await checkUsernameAvailability(user);
				setUsernameAvailable(available);
				if (!available) {
					setUsernameError("このユーザーIDは既に使用されています。");
				}
			} catch {
				setUsernameAvailable(null);
			} finally {
				setIsCheckingUsername(false);
			}
		}, 500);
		onCleanup(() => clearTimeout(timer));
	});

	// パスワードのリアルタイムバリデーション
	createEffect(() => {
		const pass = password();
		if (!pass) {
			setPasswordError("");
			return;
		}
		if (pass.length < 8) {
			setPasswordError("パスワードは8文字以上で入力してください。");
		} else if (pass.length > 128) {
			setPasswordError("パスワードは128文字以内で入力してください。");
		} else {
			setPasswordError("");
		}
	});

	// パスワード確認のリアルタイムバリデーション
	createEffect(() => {
		const pass = password();
		const confirm = passwordConfirm();
		if (!confirm) {
			setPasswordConfirmError("");
			return;
		}
		if (pass !== confirm) {
			setPasswordConfirmError("パスワードが一致しません。");
		} else {
			setPasswordConfirmError("");
		}
	});

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
			await import("../../../api/auth").then(({ postRegister }) =>
				postRegister({ username: username(), password: password() }),
			);
			// 登録成功後は自動でログイン状態になるのでユーザーページへ遷移
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
				<div class="mb-6 text-left">
					<TextField class="mb-2" validationState={usernameError() ? "invalid" : "valid"}>
						<TextField.Input
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 data-invalid:border-red-500"
							placeholder="ユーザーID"
							value={username()}
							onInput={(event) => setUsername(event.currentTarget.value)}
						/>
						{usernameError() && (
							<TextField.ErrorMessage class="text-sm text-red-600">
								{usernameError()}
							</TextField.ErrorMessage>
						)}
						{isCheckingUsername() && (
							<TextField.Description class="text-sm text-gray-500">
								⏳ 確認中...
							</TextField.Description>
						)}
						{usernameAvailable() === true && (
							<TextField.Description class="text-sm text-green-600">
								✓ 利用可能です
							</TextField.Description>
						)}
						<TextField.Description class="text-xs text-gray-500">
							小文字の英数字のみ 5文字〜50文字
						</TextField.Description>
					</TextField>
					<TextField class="mb-2" validationState={passwordError() ? "invalid" : "valid"}>
						<TextField.Input
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 data-invalid:border-red-500"
							placeholder="パスワード"
							type="password"
							value={password()}
							onInput={(event) => setPassword(event.currentTarget.value)}
						/>
						{passwordError() && (
							<TextField.ErrorMessage class="text-sm text-red-600">
								{passwordError()}
							</TextField.ErrorMessage>
						)}
						<TextField.Description class="text-xs text-gray-500">
							8文字〜128文字
						</TextField.Description>
					</TextField>
					<TextField class="mb-2"
						validationState={passwordConfirmError() ? "invalid" : "valid"}
					>
						<TextField.Input
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 data-invalid:border-red-500"
							placeholder="パスワード（確認）"
							type="password"
							value={passwordConfirm()}
							onInput={(event) => setPasswordConfirm(event.currentTarget.value)}
						/>
						{passwordConfirmError() && (
							<TextField.ErrorMessage class="text-sm text-red-600">
								{passwordConfirmError()}
							</TextField.ErrorMessage>
						)}
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

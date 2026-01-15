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
	const [passwordError, setPasswordError] = createSignal("");
	const [passwordConfirmError, setPasswordConfirmError] = createSignal("");
	const [usernameAvailable, setUsernameAvailable] = createSignal<
		boolean | null
	>(null);
	const [isCheckingUsername, setIsCheckingUsername] = createSignal(false);
	const [isAlphanumeric, setIsAlphanumeric] = createSignal<boolean | null>(
		null,
	);
	const [isValidLength, setIsValidLength] = createSignal<boolean | null>(null);
	const [isPasswordValidLength, setIsPasswordValidLength] = createSignal<
		boolean | null
	>(null);
	const [hasUsernameTouched, setHasUsernameTouched] = createSignal(false);

	// ユーザー名のバリデーション
	createEffect(() => {
		const user = username();

		if (!user) {
			setIsAlphanumeric(null);
			setIsValidLength(null);
			setUsernameAvailable(null);
			return;
		}

		// 条件1: 小文字英数字のみ
		const alnum = /^[a-z0-9]+$/.test(user);
		setIsAlphanumeric(alnum);

		// 条件2: 5〜50文字
		const len = user.length >= 5 && user.length <= 50;
		setIsValidLength(len);

		// 条件3: 重複チェック（条件1,2がOKの場合のみ実行）
		if (alnum && len) {
			setIsCheckingUsername(true);
			const timer = setTimeout(async () => {
				try {
					const available = await checkUsernameAvailability(user);
					setUsernameAvailable(available);
				} catch {
					setUsernameAvailable(null);
				} finally {
					setIsCheckingUsername(false);
				}
			}, 500);
			onCleanup(() => clearTimeout(timer));
		} else {
			setUsernameAvailable(null);
		}
	});

	// パスワードのバリデーション
	createEffect(() => {
		const pass = password();
		if (!pass) {
			setPasswordError("");
			setIsPasswordValidLength(null);
			return;
		}
		const valid = pass.length >= 8 && pass.length <= 128;
		setIsPasswordValidLength(valid);
		if (!valid) {
			setPasswordError("パスワードは8文字以上128文字以内で入力してください。");
		} else {
			setPasswordError("");
		}
	});

	// パスワード確認のバリデーション
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

	// 新規登録処理
	const handleRegister = async () => {
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

	// バリデーション表示用コンポーネント
	const ValidationItem = (props: {
		status: boolean | null;
		isChecking?: boolean;
		text: string;
	}) => {
		const getIcon = () => {
			if (props.isChecking) return "⏳";
			if (props.status === null) return "・";
			return props.status ? "✓" : "✗";
		};
		const getColor = () => {
			if (props.isChecking) return "text-gray-500";
			if (props.status === null) return "text-gray-500";
			return props.status ? "text-green-600" : "text-red-600";
		};
		return (
			<div class={`text-xs ${getColor()}`}>
				{getIcon()} {props.text}
			</div>
		);
	};

	const isUsernameValid = () => {
		return (
			isAlphanumeric() === true &&
			isValidLength() === true &&
			usernameAvailable() === true
		);
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
					<TextField
						class="mb-2"
						validationState={
							!hasUsernameTouched()
								? undefined
								: isUsernameValid()
									? "valid"
									: "invalid"
						}
					>
						<TextField.Input
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 data-invalid:border-red-500"
							placeholder="ユーザーID"
							value={username()}
							onInput={(event) => {
								setUsername(event.currentTarget.value);
								setHasUsernameTouched(true);
							}}
						/>
						<TextField.Description class="mt-1">
							<ValidationItem
								status={isAlphanumeric()}
								text="小文字の英数字のみ"
							/>
							<ValidationItem status={isValidLength()} text="5文字〜50文字" />
							<ValidationItem
								status={usernameAvailable()}
								isChecking={isCheckingUsername()}
								text="他ユーザーと重複しないもの"
							/>
						</TextField.Description>
					</TextField>
					<TextField
						class="mb-2"
						validationState={passwordError() ? "invalid" : "valid"}
					>
						<TextField.Input
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 data-invalid:border-red-500"
							placeholder="パスワード"
							type="password"
							value={password()}
							onInput={(event) => setPassword(event.currentTarget.value)}
						/>
						{/* {passwordError() && (
							<TextField.ErrorMessage class="text-sm text-red-600">
								{passwordError()}
							</TextField.ErrorMessage>
						)} */}
						<TextField.Description class="mt-1">
							<ValidationItem
								status={isPasswordValidLength()}
								text="8文字〜128文字"
							/>
						</TextField.Description>
					</TextField>
					<TextField
						class="mb-4"
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
							<TextField.ErrorMessage class="text-xs text-red-600">
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
					<div class="flex justify-center">
						<button
							type="button"
							class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
							onClick={handleRegister}
							disabled={
								!(
									isUsernameValid() &&
									isPasswordValidLength() === true &&
									!passwordError() &&
									!passwordConfirmError() &&
									agreedToTerms()
								) || isSubmitting()
							}
						>
							{isSubmitting() ? "処理中..." : "登録"}
						</button>
					</div>
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

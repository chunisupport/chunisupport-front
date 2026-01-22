import { Title } from "@solidjs/meta";
import { createSignal, Show } from "solid-js";

import { postRegisterData } from "../../api/register-data";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type UploadFormat = "json" | "text";

const formatLabelMap: Record<UploadFormat, string> = {
	json: "JSON (debug)",
	text: "TXT (base64+gzip)",
};

const RegisterScoreTempPage = () => {
	const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
	const [format, setFormat] = createSignal<UploadFormat | null>(null);
	const [errorMessage, setErrorMessage] = createSignal("");
	const [successMessage, setSuccessMessage] = createSignal("");
	const [isSubmitting, setIsSubmitting] = createSignal(false);

	const resetMessages = () => {
		setErrorMessage("");
		setSuccessMessage("");
	};

	const detectFormat = (file: File): UploadFormat | null => {
		const extension = file.name.split(".").pop()?.toLowerCase();
		if (extension === "json") {
			return "json";
		}
		if (extension === "txt") {
			return "text";
		}
		return null;
	};

	const handleFileChange = (event: Event) => {
		resetMessages();
		const target = event.currentTarget as HTMLInputElement;
		const file = target.files?.[0] ?? null;

		if (!file) {
			setSelectedFile(null);
			setFormat(null);
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			setSelectedFile(null);
			setFormat(null);
			setErrorMessage("ファイルサイズは5MB以下にしてください。");
			return;
		}

		const detectedFormat = detectFormat(file);
		if (!detectedFormat) {
			setSelectedFile(null);
			setFormat(null);
			setErrorMessage("アップロードできるのは .json または .txt のみです。");
			return;
		}

		setSelectedFile(file);
		setFormat(detectedFormat);
	};

	const handleSubmit = async () => {
		resetMessages();

		if (!selectedFile() || !format()) {
			setErrorMessage("アップロードするファイルを選択してください。");
			return;
		}

		setIsSubmitting(true);
		try {
			const fileText = await selectedFile()!.text();
			const uploadFormat = format()!;

			if (uploadFormat === "json") {
				try {
					JSON.parse(fileText);
				} catch {
					setErrorMessage("JSONの形式が正しくありません。");
					return;
				}
			}

			await postRegisterData({
				data: fileText,
				format: uploadFormat,
			});
			setSuccessMessage("スコアデータを送信しました。");
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: "アップロードに失敗しました。",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div class="mx-auto w-full max-w-3xl p-6">
			<Title>スコア登録(一時) - Chunisupport</Title>
			<div class="space-y-4">
				<div>
					<h1 class="text-2xl font-semibold">スコア情報アップロード</h1>
					<p class="mt-2 text-sm text-gray-600">
						.txt (base64+gzip) もしくは .json (デバッグ用) をアップロードできます。
						JSONは送信時に <span class="font-semibold">?format=json</span>
						 を付与します。
					</p>
				</div>

				<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
					<div class="space-y-3">
						<label class="block text-sm font-medium text-gray-700" for="score-file">
							アップロードファイル
						</label>
						<input
							id="score-file"
							type="file"
							accept=".json,.txt"
							onChange={handleFileChange}
							class="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-600 hover:file:bg-blue-100"
						/>
						<Show when={selectedFile()}>
							{(file) => (
								<div class="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
									<p>ファイル名: {file().name}</p>
									<p>
										形式:
										<span class="ml-1 font-semibold">
											{format() ? formatLabelMap[format()!] : "未判定"}
										</span>
									</p>
									<p>サイズ: {(file().size / 1024).toFixed(1)} KB</p>
								</div>
							)}
						</Show>
						<div class="text-xs text-gray-500">
							アップロード上限は5MBです。Cookie認証が必要なのでログイン済みで操作してください。
						</div>
					</div>
				</div>

				<Show when={errorMessage()}>
					<p class="text-sm text-red-600">{errorMessage()}</p>
				</Show>
				<Show when={successMessage()}>
					<p class="text-sm text-green-600">{successMessage()}</p>
				</Show>

				<button
					type="button"
					class="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
					onClick={handleSubmit}
					disabled={isSubmitting()}
				>
					{isSubmitting() ? "送信中..." : "アップロードする"}
				</button>
			</div>
		</div>
	);
};

export default RegisterScoreTempPage;

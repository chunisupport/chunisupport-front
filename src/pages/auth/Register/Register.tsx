import { TextField } from "@kobalte/core/text-field";
import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { onMount } from "solid-js";

import { fetchMe } from "../../../api/users";

const Register = () => {
	const navigate = useNavigate();

	// すでにログインしている場合はユーザーページへリダイレクト
	onMount(async () => {
		try {
			const user = await fetchMe();
			navigate(`/users/${encodeURIComponent(user.username)}`);
		} catch (error) {
			console.error("Failed to fetch user info:", error);
		}
	});

	// TODO: Google対応の登録処理を実装(API実装待ち？)

	return (
		<div class="min-h-screen flex justify-center px-4 py-10">
			<Title>新規登録 - ChuniSupport</Title>
			<div class="w-full max-w-md">
				<div class="text-center">
					<h1 class="text-2xl font-semibold">新規登録</h1>
				</div>

				{/* ユーザー名入力 */}
				<div class="mt-6">
					<TextField>
						<TextField.Label class="block mb-1 font-medium">
							Chunisupport ユーザー名
						</TextField.Label>
						<TextField.Input
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="ユーザー名を入力"
						/>
					</TextField>
				</div>

				{/* 利用規約 */}
				<div class="mt-6 text-sm text-gray-600">
					登録することで、
					<a href="/terms" class="text-blue-500 underline">
						利用規約
					</a>
					に同意したものとみなされます。
				</div>

				{/* 登録ボタン */}
				<div class="mt-6">
					<button
						type="button"
						class="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
					>
						登録
					</button>
				</div>
			</div>
		</div>
	);
};

export default Register;

import { Collapsible } from "@kobalte/core/collapsible";
import { TextField } from "@kobalte/core/text-field";
import { Title } from "@solidjs/meta";

const Login = () => {
	// TODO: アクセス時にログイン済みなら /user/{username} へリダイレクトする処理を追加

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
								/>
								<TextField.Input
									class="mb-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="データ2"
								/>
							</TextField>
							<button
								type="button"
								class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
							>
								実行
							</button>
						</Collapsible.Content>
					</Collapsible>
				</div>
			</div>
		</div>
	);
};

export default Login;

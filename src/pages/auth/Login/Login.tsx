import { Title } from "@solidjs/meta";

const Login = () => {

	return (
		<div class="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
			<Title>ログイン - ChuniSupport</Title>
			<div class="w-full max-w-md card p-8">
				<div class="space-y-2 text-center">
					<p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
						ChuniSupport
					</p>
					<h1 class="text-2xl font-semibold text-slate-900">ログイン</h1>
					<p class="text-sm text-slate-500">アカウントでサインイン</p>
				</div>
                {/* Login form goes here */}
            </div>
		</div>
	);
};

export default Login;

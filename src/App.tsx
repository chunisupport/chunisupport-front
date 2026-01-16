import { MetaProvider } from "@solidjs/meta";
import { A, Route, Router } from "@solidjs/router";
import type { JSX } from "solid-js";
import { NavBar } from "./components";
import {
	AdminPage,
	AdminSongsPage,
	AdminUsersPage,
	EditorPage,
	EditorSongsPage,
	Login,
	Register,
	UserPage,
} from "./pages";

const withNavBar = <P extends object>(Component: (props: P) => JSX.Element) => {
	return (props: P) => (
		<NavBar>
			<Component {...props} />
		</NavBar>
	);
};

const App = () => {
	return (
		<MetaProvider>
			<Router>
				{/* ランディングページ */}
				<Route
					path="/"
					component={() => (
						<>
							<h1>Welcome!</h1>
							<A href="/login">Login</A>
						</>
					)}
				/>

				{/* 認証系 */}
				<Route path="/login" component={Login} />
				<Route path="/register" component={Register} />

				{/* ユーザ */}
				<Route path="/users/:username" component={withNavBar(UserPage)} />
				<Route
					path="/users/:username/records"
					component={withNavBar(() => <h1>User Records Page</h1>)}
				/>
				<Route
					path="/users/:username/stats"
					component={withNavBar(() => <h1>User Stats Page</h1>)}
				/>

				{/* 楽曲 */}
				<Route
					path="/songs"
					component={withNavBar(() => <h1>Songs List Page</h1>)}
				/>
				<Route
					path="/songs/:displayid"
					component={withNavBar(() => <h1>Song Detail Page</h1>)}
				/>

				{/* その他 */}
				<Route
					path="/tools"
					component={withNavBar(() => <h1>Tools Page</h1>)}
				/>
				<Route
					path="/settings"
					component={withNavBar(() => <h1>Settings Page</h1>)}
				/>
				<Route
					path="/terms"
					component={withNavBar(() => <h1>Terms of Service Page</h1>)}
				/>

				{/* 管理系 */}
				<Route path="/admin" component={withNavBar(AdminPage)} />
				<Route
					path="/admin/users"
					component={withNavBar(AdminUsersPage)}
				/>
				<Route
					path="/admin/songs"
					component={withNavBar(AdminSongsPage)}
				/>
				<Route path="/editor" component={withNavBar(EditorPage)} />
				<Route
					path="/editor/songs"
					component={withNavBar(EditorSongsPage)}
				/>
			</Router>
		</MetaProvider>
	);
};

export default App;

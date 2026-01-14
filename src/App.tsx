import { MetaProvider } from "@solidjs/meta";
import { A, Route, Router } from "@solidjs/router";
import type { JSX } from "solid-js";
import { NavBar } from "./components";
import { Login, Register, UserPage } from "./pages";

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
				<Route
					path="/users"
					component={withNavBar(() => <h1>Users List Page</h1>)}
				/>
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

				{/* 管理系 */}
				<Route path="/admin" component={() => <h1>Admin Page</h1>} />
				<Route
					path="/admin/users"
					component={() => <h1>Admin Users Management Page</h1>}
				/>
				<Route
					path="/admin/songs"
					component={() => <h1>Admin Songs Management Page</h1>}
				/>
				<Route path="/editor" component={() => <h1>Editor Page</h1>} />
				<Route
					path="/editor/songs"
					component={() => <h1>Editor Songs Management Page</h1>}
				/>
			</Router>
		</MetaProvider>
	);
};

export default App;

import type { JSX } from "solid-js";
import { Route, Router } from "@solidjs/router";
import { MetaProvider } from "@solidjs/meta";
import { AppShell } from "./components";
import {
    UserPage
} from "./pages";

const withAppShell = (Component: () => JSX.Element) => {
    return () => (
        <AppShell>
            <Component />
        </AppShell>
    );
};

const App = () => {
    return (
        <MetaProvider>
            <Router>
                <Route path="/" component={withAppShell(() => <h1>Root Page</h1>)} />
                <Route path="/users/:username" component={withAppShell(UserPage)} />
            </Router>
        </MetaProvider>
    );
};

export default App;

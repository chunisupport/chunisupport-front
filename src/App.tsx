import type { JSX } from "solid-js";
import { Route, Router } from "@solidjs/router";
import { MetaProvider } from "@solidjs/meta";
import { AppShell } from "./components";

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
            </Router>
        </MetaProvider>
    );
};

export default App;

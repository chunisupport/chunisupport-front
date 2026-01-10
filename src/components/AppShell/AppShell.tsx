import type { JSX } from "solid-js";

type AppShellProps = {
    children: JSX.Element;
};

const AppShell = (props: AppShellProps) => {
    return (
        <main>{props.children}</main>
    );
};

export default AppShell;

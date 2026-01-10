import type { JSX } from "solid-js";

type NavBarProps = {
    children: JSX.Element;
};

const NavBar = (props: NavBarProps) => {
    return (
        <main>{props.children}</main>
    );
};

export default NavBar;

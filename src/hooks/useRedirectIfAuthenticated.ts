import { useNavigate } from "@solidjs/router";
import { onMount } from "solid-js";

import { fetchMe } from "../api/users";

const useRedirectIfAuthenticated = () => {
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
};

export default useRedirectIfAuthenticated;

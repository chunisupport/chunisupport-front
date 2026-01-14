import { useNavigate } from "@solidjs/router";
import { onMount } from "solid-js";
import { postLogout } from "../../../api/auth";
import { Loading } from "../../../components";

const Logout = () => {
	const navigate = useNavigate();

	onMount(async () => {
		try {
			await postLogout();
			navigate("/");
		} catch (error) {
			console.error("Logout failed:", error);
			navigate("/");
		}
	});

	return (
        <div class="min-h-screen flex items-center justify-center">
            <Loading />
        </div>
    );
};

export default Logout;

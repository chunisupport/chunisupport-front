import { API_BASE_URL } from "../config";
import { getErrorMessage } from "../types/api";

type LoginPayload = {
	username: string;
	password: string;
};

export const postLogin = async (payload: LoginPayload): Promise<void> => {
	const response = await fetch(`${API_BASE_URL}/internal/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(getErrorMessage(error));
	}
};

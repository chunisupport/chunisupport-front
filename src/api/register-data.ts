import { API_BASE_URL } from "../config";
import { getErrorMessage } from "../types/api";

type RegisterDataFormat = "json" | "text";

type RegisterDataPayload = {
	data: string;
	format: RegisterDataFormat;
};

export const postRegisterData = async (
	payload: RegisterDataPayload,
): Promise<void> => {
	const isJson = payload.format === "json";
	const response = await fetch(
		`${API_BASE_URL}/internal/me/register-data${isJson ? "?format=json" : ""}`,
		{
			method: "POST",
			headers: {
				"Content-Type": isJson ? "application/json" : "text/plain",
			},
			credentials: "include",
			body: payload.data,
		},
	);

	if (!response.ok) {
		let message = "エラーが発生しました";
		try {
			const error = await response.json();
			message = getErrorMessage(error);
		} catch {
			if (response.statusText) {
				message = response.statusText;
			}
		}
		throw new Error(message);
	}
};

import { API_BASE_URL } from "../config";
import type { SongsResponse } from "../types/api";
import { getErrorMessage } from "../types/api";

export const fetchSongs = async (): Promise<SongsResponse> => {
	const searchParams = new URLSearchParams();
	searchParams.set("include_deleted", "true");

	const response = await fetch(
		`${API_BASE_URL}/internal/songs?${searchParams.toString()}`,
		{
			credentials: "include",
		},
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(getErrorMessage(error));
	}

	return response.json();
};

export const deleteSong = async (displayId: string): Promise<void> => {
	const response = await fetch(
		`${API_BASE_URL}/internal/songs/${encodeURIComponent(displayId)}`,
		{
			method: "DELETE",
			credentials: "include",
		},
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(getErrorMessage(error));
	}
};

export const restoreSong = async (displayId: string): Promise<void> => {
	const response = await fetch(
		`${API_BASE_URL}/internal/songs/${encodeURIComponent(displayId)}/restore`,
		{
			method: "POST",
			credentials: "include",
		},
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(getErrorMessage(error));
	}
};

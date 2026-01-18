import { API_BASE_URL } from "../config";
import { getErrorMessage, type SongDTO } from "../types/api";

export const fetchAllSongs = async (): Promise<{ songs: SongDTO[] }> => {
	const response = await fetch(`${API_BASE_URL}/internal/songs`, {
		credentials: "include",
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(getErrorMessage(error));
	}

	return response.json();
};

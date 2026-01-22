import { API_BASE_URL } from "../config";
import {
	getErrorMessage,
	type MasterDataDTO,
	type SongDTO,
} from "../types/api";

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

// --- マスターデータ取得API ---
export const fetchMasterData = async (): Promise<MasterDataDTO> => {
	const response = await fetch(`${API_BASE_URL}/internal/master`, {
		credentials: "include",
	});
	if (!response.ok) {
		const error = await response.json();
		throw new Error(getErrorMessage(error));
	}
	return response.json();
};

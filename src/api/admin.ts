import { API_BASE_URL } from "../config";
import type { UserListResponse } from "../types/api";
import { getErrorMessage } from "../types/api";

type AdminUserListParams = {
	name?: string;
};

export const fetchAdminUsers = async (
	params: AdminUserListParams,
): Promise<UserListResponse[]> => {
	const searchParams = new URLSearchParams();
	if (params.name) {
		searchParams.set("name", params.name);
	}

	const response = await fetch(
		`${API_BASE_URL}/admin/users?${searchParams.toString()}`,
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

export const deleteAdminUser = async (username: string): Promise<void> => {
	const response = await fetch(
		`${API_BASE_URL}/internal/users/${encodeURIComponent(username)}`,
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

export const restoreAdminUser = async (username: string): Promise<void> => {
	const response = await fetch(
		`${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/restore`,
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

import { API_BASE_URL } from "../config";
import type { UserProfileWithRecordsDTO } from "../types/api";
import { getErrorMessage } from "../types/api";

export const fetchUserProfile = async ( username: string ): Promise<UserProfileWithRecordsDTO> => {
  const response = await fetch(`${API_BASE_URL}/internal/users/${username}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(getErrorMessage(error));
  }

  return response.json();
};

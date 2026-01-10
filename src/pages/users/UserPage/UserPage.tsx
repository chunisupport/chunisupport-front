import { useParams } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { createResource, Suspense, Show, ErrorBoundary } from "solid-js";
import { API_BASE_URL } from "../../../config";
import type { UserProfileWithRecordsDTO } from "../../../types/api";
import { getErrorMessage } from "../../../types/api";

const UserPage = () => {
    const params = useParams<{ username: string }>();

    // ユーザープロファイル取得関数
    const fetchUserProfile = async (username: string): Promise<UserProfileWithRecordsDTO> => {
        const response = await fetch(`${API_BASE_URL}/internal/users/${username}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(getErrorMessage(error));
        }

        const data = await response.json();
        return data;
    };

    const [userProfile] = createResource(() => params.username, fetchUserProfile);

    return (
        <>
            <Title>{params.username}さんのページ - Chunisupport</Title>
            <h1>User Page: {params.username}</h1>
            <p>API Base URL: {API_BASE_URL}</p>

            <Suspense fallback={<p>プロファイルを読み込み中...</p>}>
                <ErrorBoundary fallback={(err) => <p style={{ color: 'red' }}>エラー: {err.message}</p>}>
                    <Show when={userProfile()}>
                        {(profile) => (
                            <div>
                                <h2>プロファイル取得成功</h2>
                                <pre>{JSON.stringify(profile(), null, 2)}</pre>
                            </div>
                        )}
                    </Show>
                </ErrorBoundary>
            </Suspense>
        </>
    );
};

export default UserPage;

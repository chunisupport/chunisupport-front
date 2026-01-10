import { Suspense, ErrorBoundary, Show } from "solid-js";
import type { Component } from "solid-js";
import { useParams } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { createResource } from "solid-js";

import { fetchUserProfile } from "../../../api/users";
import { UserProfileView } from "./UserProfileView";

const UserPage: Component = () => {
  const params = useParams<{ username: string }>();

  const [userProfile] = createResource(
    () => params.username,
    fetchUserProfile,
  );

  return (
    <>
      <Title>{params.username}さんのページ - Chunisupport</Title>

      <Suspense fallback={<p>プロファイルを読み込み中...</p>}>
        <ErrorBoundary
          fallback={(err) => (
            <p style={{ color: "red" }}>エラー: {err.message}</p>
          )}
        >
          <Show when={userProfile()}>
            {(profile) => <UserProfileView profile={profile()} />}
          </Show>
        </ErrorBoundary>
      </Suspense>
    </>
  );
};

export default UserPage;

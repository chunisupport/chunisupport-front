import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import type { Component } from "solid-js";
import { createResource, ErrorBoundary, Show, Suspense } from "solid-js";

import { fetchUserProfile } from "../../../api/users";
import { Loading } from "../../../components";
import { UserProfileView } from "./UserProfileView";

const UserPage: Component = () => {
	const params = useParams<{ username: string }>();

	const [userProfile] = createResource(() => params.username, fetchUserProfile);

	return (
		<>
			<Title>{params.username}さんのページ - Chunisupport</Title>
			<Suspense fallback={<Loading />}>
				<ErrorBoundary
					fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}
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

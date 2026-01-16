import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import type { Component } from "solid-js";
import { createResource, ErrorBoundary, Suspense } from "solid-js";

import { fetchUserProfile } from "../../../api/users";
import { Loading } from "../../../components";

const UserRecord: Component = () => {
	const params = useParams<{ username: string }>();

	const [userProfile] = createResource(() => params.username, fetchUserProfile);


	return (
		<>
			<Title>{params.username}さんのページ - Chunisupport</Title>
			<Suspense fallback={<Loading />}>
				<ErrorBoundary
					fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}
				>
				<div class="p-4 md:p-8">
					ユーザーレコードページ
					<div class="mt-4">
						<strong>Username:</strong> {userProfile()?.username}
					</div>
				</div>

				</ErrorBoundary>
			</Suspense>
		</>
	);
};

export default UserRecord;

import { Title } from "@solidjs/meta";

import { RoleGate, SongsManagement } from "../../components";

const EditorSongsPage = () => {
	return (
		<RoleGate allowedRoles={["ADMIN", "EDITOR"]}>
			<>
				<Title>楽曲管理 - Chunisupport</Title>
				<SongsManagement
					pageTitle="楽曲管理"
					description="編集者向けに楽曲一覧の確認と削除・復活操作を行います。"
				/>
			</>
		</RoleGate>
	);
};

export default EditorSongsPage;

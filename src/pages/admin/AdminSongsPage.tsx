import { Title } from "@solidjs/meta";

import { RoleGate } from "../../components";
import SongsManagement from "../shared/SongsManagement";

const AdminSongsPage = () => {
	return (
		<RoleGate allowedRoles={["ADMIN"]}>
			<>
				<Title>楽曲管理 - Chunisupport</Title>
				<SongsManagement
					pageTitle="楽曲管理"
					description="楽曲一覧の確認と削除・復活操作を行います。"
				/>
			</>
		</RoleGate>
	);
};

export default AdminSongsPage;

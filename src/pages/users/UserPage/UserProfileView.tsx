import type { Component } from "solid-js";
import type {
	HonorDTO,
	PlayerDTO,
	PlayerRecordDTO,
	UserProfileWithRecordsDTO,
} from "../../../types/api";

type Props = {
	profile: UserProfileWithRecordsDTO;
};

export const UserProfileView: Component<Props> = (props) => {
	const { profile } = props;
	const playerInfo: PlayerDTO = profile.player;
	const honors: HonorDTO[] = playerInfo.honors;

	const bestRecords: PlayerRecordDTO[] = profile.records.best;
	const newRecords: PlayerRecordDTO[] = profile.records.new;

	const sumRating = (records: PlayerRecordDTO[]): number => {
		return records.reduce((sum, record) => sum + record.rating, 0);
	};

	const bestRating = sumRating(bestRecords) / bestRecords.length;
	const newRating = sumRating(bestRecords) / newRecords.length;
	const playerRating =
		(sumRating(bestRecords) + sumRating(newRecords)) /
		(bestRecords.length + newRecords.length);

	return (
		<div class="m-4">
			{/* ネームプレート */}
			<div class="px-3 py-3 border border-gray-200 shadow-sm rounded-md ">
				{/* <p class="mb-1 text-gray-400 text-xs">Chunisupport v1.0.0</p> */}
				{/* TODO: 称号の背景画像を表示 */}
				<p class="mb-3 p-1 bg-yellow-200 rounded-md text-sm text-center">
					{honors[0].name}
				</p>
				<div class="mb-2 flex flex-row items-end justify-between">
					<p class="">Lv. {playerInfo.level}</p>
					<h1 class="flex-1 text-xl font-medium text-center">
						{playerInfo.name}
					</h1>
				</div>
				<hr class="mb-2 border-t border-gray-200" />
				<p>
					Rating {playerRating.toFixed(4)}{" "}
					<span class="text-gray-500">
						(Best {bestRating.toFixed(4)} / New {newRating.toFixed(4)})
					</span>
				</p>
				{/* TODO: OverPowerのゲージみたいなのあるといいよね */}
				<p>OP {playerInfo.overpower_percent}%</p>
			</div>

			{/* TODO: タブ切り替え */}
			<div class="mb-4"></div>

			{/* BEST枠一覧 */}
			<div class="">
				{bestRecords.map((record, i) => (
                    // TODO: 難易度によって色を変更する
					<div class="mb-2 p-3 border border-purple-400 bg-purple-100 rounded-md ">
						<div class="flex gap-3">
							<div class="flex flex-col">
								<p># {i+1}</p>
								<p>{record.rating.toFixed(2)}</p>
							</div>
							<div>
								<p class="font-medium">{record.title}</p>
								<p>
									{record.const} / {record.score}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

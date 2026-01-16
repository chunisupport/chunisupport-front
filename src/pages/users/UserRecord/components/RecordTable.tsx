import type { Component } from "solid-js";
import type { PlayerRecordDTO } from "../../../../types/api";

interface RecordTableProps {
	records: PlayerRecordDTO[];
}

const difficultyShort = (difficulty: PlayerRecordDTO["difficulty"]) => {
	switch (difficulty) {
		case "BASIC":
			return "B";
		case "ADVANCED":
			return "A";
		case "EXPERT":
			return "E";
		case "MASTER":
			return "M";
		case "ULTIMA":
			return "U";
		default:
			return "";
	}
};

const difficultyColor = (difficulty: PlayerRecordDTO["difficulty"]) => {
	switch (difficulty) {
		case "BASIC":
			return "bg-green-100 text-green-800";
		case "ADVANCED":
			return "bg-yellow-100 text-yellow-800";
		case "EXPERT":
			return "bg-pink-100 text-pink-800";
		case "MASTER":
			return "bg-purple-100 text-purple-800";
		case "ULTIMA":
			return "bg-red-100 text-red-800";
		default:
			return "";
	}
};

const lampBadge = (lamp: PlayerRecordDTO["combo_lamp"]) => {
	if (lamp === "FULL COMBO")
		return (
			<span class="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">
				FULL COMBO
			</span>
		);
	if (lamp === "ALL JUSTICE")
		return (
			<span class="px-2 py-1 rounded bg-yellow-200 text-yellow-900 text-xs">
				ALL JUSTICE
			</span>
		);
	return (
		<span class="px-2 py-1 rounded bg-gray-100 text-gray-500 text-xs">-</span>
	);
};

export const RecordTable: Component<RecordTableProps> = (props) => {
	return (
		<div class="overflow-x-auto w-full">
			<table class="min-w-full max-w-full border border-gray-300 bg-white rounded-lg text-xs table-auto">
				<thead>
					<tr class="bg-gray-100">
						<th class="px-2 py-1 text-left w-[40%]">曲名</th>
						<th class="px-2 py-1 text-center w-[10%]">難易度</th>
						<th class="px-2 py-1 text-right w-[15%]">定数</th>
						<th class="px-2 py-1 text-right w-[20%]">スコア</th>
						<th class="px-2 py-1 text-center w-[15%]">ランプ</th>
					</tr>
				</thead>
				<tbody>
					{props.records.length === 0 ? (
						<tr>
							<td colSpan={5} class="text-center py-6 text-gray-400">
								データがありません
							</td>
						</tr>
					) : (
						props.records.map((record) => (
							<tr class="border-t">
								<td class="px-2 py-1 truncate max-w-48" title={record.title}>
									{record.title}
								</td>
								<td class="px-2 py-1 text-center font-bold">
									<span
										class={`px-2 py-1 rounded ${difficultyColor(record.difficulty)} text-xs font-bold`}
									>
										{difficultyShort(record.difficulty)}
									</span>
								</td>
								<td class="px-2 py-1 text-right">{record.const}</td>
								<td class="px-2 py-1 text-right">{record.score}</td>
								<td class="px-2 py-1 text-center">
									{lampBadge(record.combo_lamp)}
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
};

export default RecordTable;

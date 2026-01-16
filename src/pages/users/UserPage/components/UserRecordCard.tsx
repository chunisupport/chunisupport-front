import type { Component } from "solid-js";
import type { PlayerRecordDTO } from "../../../../types/api";

type Props = {
	record: PlayerRecordDTO;
	index: number;
};

const getDifficultyColors = (difficulty: string) => {
	switch (difficulty) {
		case "BASIC":
			return "border-green-500 bg-green-200";
		case "ADVANCED":
			return "border-orange-500 bg-orange-200";
		case "EXPERT":
			return "border-red-500 bg-red-200";
		case "ULTIMA":
			return "border-red-500 bg-black text-white";
		case "MASTER":
			return "border-purple-500 bg-purple-200";
		default:
			return "border-gray-500 bg-gray-200";
	}
};

export const UserRecordCard: Component<Props> = (props) => {
	return (
		<div
			class={`mb-2 p-3 rounded-md border ${getDifficultyColors(props.record.difficulty)}`}
		>
			<div class="flex gap-3">
				<div class="flex flex-col">
					<p># {props.index + 1}</p>
					<p class="text-sm">{props.record.rating.toFixed(2)}</p>
				</div>
				<div>
					<p class="font-medium">{props.record.title}</p>
					<p class="text-sm">
						{props.record.const} / {props.record.score}
					</p>
				</div>
			</div>
		</div>
	);
};

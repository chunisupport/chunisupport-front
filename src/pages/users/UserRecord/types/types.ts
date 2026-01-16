// フィルター状態の型定義

import type { PlayerRecordDTO } from "../../../../types/api";

export type Difficulty = PlayerRecordDTO["difficulty"];
export type ComboLamp = PlayerRecordDTO["combo_lamp"];

export interface FilterState {
	title: string;
	difficulties: Difficulty[];
	constMin: number | null;
	constMax: number | null;
	scoreMin: number | null;
	scoreMax: number | null;
	lamps: ComboLamp[];
}

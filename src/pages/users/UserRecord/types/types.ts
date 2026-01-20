import type { PlayerRecordDTO } from "../../../../types/api";

export type Difficulty = PlayerRecordDTO["difficulty"];
export type ComboLamp = PlayerRecordDTO["combo_lamp"];

/** フィルターの型定義 */
export interface FilterState {
	title: string;
	difficulties: Difficulty[];
	genres: string[];
	versions: string[];
	constMin: number;
	constMax: number;
	scoreMin: number;
	scoreMax: number;
	lamps: ComboLamp[];
	excludeNoPlay: boolean;
}

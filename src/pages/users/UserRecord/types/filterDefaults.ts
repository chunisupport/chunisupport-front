import type { ComboLamp, FilterState } from "../types/types";

/** ランプの選択肢 */
export const LAMP_OPTIONS: (ComboLamp | null)[] = [
	"ALL JUSTICE",
	"FULL COMBO",
	null,
];

/** フィルターのデフォルト値 */
export const DEFAULT_FILTER: FilterState = {
	title: "",
	difficulties: ["MASTER", "ULTIMA"],
	genres: [],
	versions: [],
	constMin: 0.0,
	constMax: 15.9,
	scoreMin: 0,
	scoreMax: 1010000,
	lamps: ["ALL JUSTICE", "FULL COMBO", null],
	excludeNoPlay: false,
};

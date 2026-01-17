// 共通定数・型定義
import type { ComboLamp, Difficulty, FilterState } from "../types/types";

// 難易度選択肢
export const DIFFICULTY_OPTIONS: Difficulty[] = [
	"BASIC",
	"ADVANCED",
	"EXPERT",
	"MASTER",
	"ULTIMA",
];

// ランプ選択肢
export const LAMP_OPTIONS: (ComboLamp | null)[] = [
	"ALL JUSTICE",
	"FULL COMBO",
	null,
];

// フィルター初期値
export const DEFAULT_FILTER: FilterState = {
	title: "",
	difficulties: ["MASTER", "ULTIMA"],
	constMin: 0.0,
	constMax: 15.9,
	scoreMin: 0,
	scoreMax: 1010000,
	lamps: ["ALL JUSTICE", "FULL COMBO", null],
};

export type ScoreRank = "SSS+" | "SSS" | "SS+" | "SS" | "S+" | "S" | "0点" | "MAX";

export const SCORE_RANKS: ScoreRank[] = [
	"0点",
	"S",
	"S+",
	"SS",
	"SS+",
	"SSS",
	"SSS+",
	"MAX",
];

export const SCORE_RANK_VALUES: Record<ScoreRank, number> = {
	"SSS+": 1009000,
	SSS: 1007500,
	"SS+": 1005000,
	SS: 1000000,
	"S+": 990000,
	S: 975000,
	"0点": 0,
	MAX: 1010000,
};

import type { PlayerRecordDTO, SongDTO } from "../types/api";
import { dateToChunithmVersion } from "./versionConverter";

/** プレイ済み・未プレイを含むレコードの型定義 */
export interface PlayerRecordIncludeNoPlay {
	updated_at: string | null;
	difficulty: string;
	id: string;
	title: string;
	artist: string;
	genre: string;
	release: string | null;
	release_version: string;
	const: number;
	is_const_unknown: boolean;
	score: number | null;
	rating: number | null;
	overpower: number | null;
	img: string;
	clear_lamp: string | null;
	combo_lamp: string | null;
	full_chain: string | null;
	slot: string | null;
	is_played: boolean;
}

/**
 * 未プレイを含む全曲のレコードを作成する
 * @param songs 全楽曲データ
 * @param playedRecords プレイ済みレコードデータ
 * @returns 未プレイを含む全曲のレコード配列
 */
export function mergeAllRecords(
	songs: SongDTO[],
	playedRecords: PlayerRecordDTO[],
): PlayerRecordIncludeNoPlay[] {
	const result: PlayerRecordIncludeNoPlay[] = [];

	// プレイ済みレコードをMapに変換（高速検索用）
	const playedMap = new Map<string, PlayerRecordDTO>();
	for (const record of playedRecords) {
		const key = `${record.id}_${record.difficulty}`;
		playedMap.set(key, record);
	}

	// 全楽曲を走査
	for (const song of songs) {
		const difficulties: Array<keyof typeof song.charts> = [
			"BASIC",
			"ADVANCED",
			"EXPERT",
			"MASTER",
			"ULTIMA",
		];

		for (const diff of difficulties) {
			// diffはsymbol型の可能性があるためstring化
			const diffStr = String(diff);
			const chart = song.charts[diffStr as keyof typeof song.charts];
			if (!chart) continue;

			const key = `${song.id}_${diffStr}`;
			const playedRecord = playedMap.get(key);

			if (playedRecord) {
				result.push({
					...playedRecord,
					genre: song.genre,
					release: song.release,
					release_version: dateToChunithmVersion(song.release),
					is_played: true,
				});
			} else {
				result.push({
					updated_at: null,
					difficulty: diffStr,
					id: song.id,
					title: song.title,
					artist: song.artist,
					genre: song.genre,
					release: song.release,
					release_version: dateToChunithmVersion(song.release),
					const: chart.const,
					is_const_unknown: chart.is_const_unknown,
					score: null,
					rating: null,
					overpower: null,
					img: song.jacket || "",
					clear_lamp: null,
					combo_lamp: null,
					full_chain: null,
					slot: null,
					is_played: false,
				});
			}
		}
	}

	return result;
}

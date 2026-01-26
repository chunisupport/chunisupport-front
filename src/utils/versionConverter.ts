/** CHUNITHMバージョンの一覧 */
export const CHUNITHM_VERSIONS = [
	"ORIGIN",
	"ORIGIN PLUS",
	"AIR",
	"AIR PLUS",
	"STAR",
	"STAR PLUS",
	"AMAZON",
	"AMAZON PLUS",
	"CRYSTAL",
	"CRYSTAL PLUS",
	"PARADISE",
	"PARADISE LOST",
	"NEW",
	"NEW PLUS",
	"SUN",
	"SUN PLUS",
	"LUMINOUS",
	"LUMINOUS PLUS",
	"VERSE",
	"X-VERSE",
	"X-VERSE-X",
] as const;

/** CHUNITHMバージョンの開始日一覧 */
const VERSION_START_DATES = [
	"2015-07-16",
	"2016-02-04",
	"2016-08-25",
	"2017-02-09",
	"2017-08-24",
	"2018-03-08",
	"2018-10-25",
	"2019-04-11",
	"2019-10-24",
	"2020-07-16",
	"2021-01-21",
	"2021-05-13",
	"2021-11-04",
	"2022-04-14",
	"2022-10-13",
	"2023-05-11",
	"2023-12-14",
	"2024-06-20",
	"2024-12-12",
	"2025-07-16",
	"2025-12-11",
	"9999-12-31",
];

/** 指定された日付から対応するCHUNITHMバージョンを取得する */
export function dateToChunithmVersion(releaseDate: string | null): string {
	if (!releaseDate) {
		return "不明";
	}

	const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
	if (!dateRegex.test(releaseDate)) {
		return "不明";
	}

	for (let i = 0; i < CHUNITHM_VERSIONS.length; i++) {
		if (
			releaseDate >= VERSION_START_DATES[i] &&
			releaseDate < VERSION_START_DATES[i + 1]
		) {
			return CHUNITHM_VERSIONS[i];
		}
	}

	return "不明";
}

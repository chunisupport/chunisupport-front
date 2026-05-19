# マスタデータ参照箇所 調査レポート

**調査日**: 2026年05月19日  
**対象エンドポイント**: `GET /internal/master`

---

## マスタデータ概要

`/internal/master` が返すフィールドは以下のとおり。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `genres` | `MasterItemDTO[]` | ジャンル一覧（id, name, sort_order?） |
| `difficulties` | `MasterItemDTO[]` | 難易度一覧（id, name, sort_order?） |
| `versions` | `VersionDTO[]` | バージョン一覧（id, name, released_at）。フロントエンドでは `/internal/master` 経由の参照を廃止済み |
| `achievement_types` | `AchievementTypeDTO[]` | 成果種別一覧（code, label?, name?） |
| `account_types` | `MasterItemDTO[]` | アカウント種別一覧（id, name, sort_order?） |
| `rating_bands` | `RatingBandDTO[]` | レーティング帯一覧（id, label, min_inclusive, max_exclusive, sort_order） |

型定義: `src/types/api.ts`  
APIラッパー: `src/api/songs.ts` → `fetchMasterData()`

---

## フィールド別・参照箇所一覧

### `genres`（ジャンル一覧）

| ファイル | 用途 |
| --- | --- |
| `src/pages/songs/SongsList/SongsList.tsx` | 楽曲一覧のジャンルソート順として `sortSongs(..., masterData()?.genres)` に渡す |
| `src/pages/songs/WorldsendSongsList/WorldsendSongsList.tsx` | WORLD'S END楽曲一覧のジャンルソート順として `sortWorldsendSongs(..., masterData()?.genres)` に渡す |
| `src/pages/songs/SongManagementPage.tsx` | 楽曲編集フォームでのジャンル選択（`genre_id` → `genre` 名への逆引き、および `toSongDraft`/`toWorldsendDraft` での `genre_id` 解決） |
| `src/pages/goals/utils/goalProgress.ts` | `filterRecordsByAttributes` でジャンルIDを名称に変換し、楽曲ジャンルと突合してレコードをフィルタリング |
| `src/pages/goals/utils/goalForm.ts` | `formatGoalAttributesLabel` でジャンルIDを表示名に変換する処理が残っている。ただし現在この関数は実利用されていない |
| `src/pages/goals/GoalsList/components/GoalFormDialog.tsx` | 目標作成・編集ダイアログでジャンル選択チェックボックスの選択肢として表示 |
| `src/pages/users/UserOverPower/UserOverPower.tsx` | OVER POWERのジャンル別集計で、ジャンル表示順を `buildOverPowerSummary` に渡す |
| `src/usecases/overpower/overpowerSummary.ts` | ジャンル別集計行を `sort_order` に基づいて並べるために使用 |
| `src/pages/users/UserRecord/types/filterDefaults.ts` | `getMasterDataDefaults` でジャンル名一覧を全選択フィルターのデフォルト値として生成 |
| `src/pages/users/UserRecord/components/filterDialog/FilterSelectionPanel.tsx` | `GenreSection` へジャンル名配列を渡す |
| `src/pages/songs/SongsList/utils/sorting.ts` | 楽曲一覧のジャンルソートでマスタ定義順を使用 |
| `src/pages/songs/WorldsendSongsList/utils/sorting.ts` | WORLD'S END楽曲一覧のジャンルソートでマスタ定義順を使用 |

### `difficulties`（難易度一覧）

| ファイル | 用途 |
| --- | --- |
| `src/pages/songs/SongDetail/SongDetail.tsx` | 楽曲が持つ譜面を判定し、タブ表示用の `availableDifficulties` を生成するために難易度順序リストとして使用 |
| `src/pages/songs/SongManagementPage.tsx` | `toSongDraft` で楽曲のchartをdifficultyのidと紐付けて編集用ドラフトを生成 |
| `src/pages/goals/utils/goalProgress.ts` | `filterRecordsByAttributes` で難易度IDを名称に変換し、レコード難易度と突合してフィルタリング |
| `src/pages/goals/utils/goalForm.ts` | `formatGoalAttributesLabel` で難易度IDを表示名に変換する処理が残っている。ただし現在この関数は実利用されていない |
| `src/pages/goals/GoalsList/components/GoalFormDialog.tsx` | 目標作成・編集ダイアログで難易度選択チェックボックスの選択肢として表示 |
| `src/pages/users/UserRecord/components/filterDialog/FilterSelectionPanel.tsx` | `DifficultySection` へ難易度名配列を渡す |

### `versions`（バージョン一覧）

`/internal/master` の `versions` は型定義上は残っているが、現在のフロントエンド実装では `masterData.versions` を参照していない。バージョン一覧は `fetchVersions()`（`GET /internal/master/versions`）から取得する。

| ファイル | 用途 |
| --- | --- |
| `src/pages/songs/components/useSongDetailBase.ts` | `fetchVersions()` の結果を使い、楽曲リリース日から表示用バージョン名を解決 |
| `src/pages/goals/GoalsList/GoalsList.tsx` | `fetchVersions()` を `fetchMasterData()` とは別に呼び出し、目標フォーム・進捗計算へ渡す |
| `src/pages/goals/utils/goalVersion.ts` | version API の一覧を `released_at` 昇順に並べ、目標条件用のリリース順番号（1始まり）と表示名を生成。DB内部IDには依存しない |
| `src/pages/goals/utils/goalProgress.ts` | 曲のリリース日を `goalVersion.ts` のリリース順番号へ解決し、目標条件 `attributes.ver` と突合してフィルタリング |
| `src/pages/goals/utils/goalForm.ts` | `formatGoalAttributesLabel` で、目標条件のリリース順番号をバージョン表示名に変換 |
| `src/pages/goals/GoalsList/components/GoalFormDialog.tsx` | 目標作成・編集ダイアログで、リリース日順のバージョン選択チェックボックスを表示 |
| `src/pages/users/UserRecord/UserRecord.tsx` | `fetchVersions()` の結果をレコードメタ付与、フィルター初期値、フィルターダイアログへ渡す |
| `src/pages/users/UserRecord/types/filterDefaults.ts` | `fetchVersions()` の結果からフィルター初期値のバージョン名一覧を生成 |
| `src/pages/users/UserRecord/components/filterDialog/FilterSelectionPanel.tsx` | `fetchVersions()` の結果からバージョンフィルターの選択肢を生成 |
| `src/pages/users/UserRecord/utils/pageModel.ts` | `fetchVersions()` の結果を使ってレコードへ `release_version` を付与 |
| `src/pages/users/UserOverPower/UserOverPower.tsx` | `fetchVersions()` の結果を OVER POWER のバージョン別集計、グラフ分類、未解禁曲ダイアログへ渡す |
| `src/pages/users/UserOverPower/components/LockedSongsDialog.tsx` | `fetchVersions()` の結果から未解禁曲フィルターのバージョン選択肢を生成 |
| `src/usecases/overpower/overpowerSummary.ts` | `fetchVersions()` 由来の一覧で、楽曲リリース日からバージョン名を解決し、バージョン別集計をリリース日順に並べる |
| `src/utils/recordMerger.ts` | `fetchVersions()` 由来の一覧で、レコードへ表示用 `release_version` を付与 |

### `achievement_types`（成果種別）

| ファイル | 用途 |
| --- | --- |
| `src/pages/goals/GoalsList/components/GoalFormDialog.tsx` | 目標作成・編集ダイアログの「目標種別」セレクトボックスの選択肢として表示。`api/songs.ts` の `fetchMasterData` 内で型を正規化するロジックが複雑 |

### `account_types`・`rating_bands`

| フィールド | 状況 |
| --- | --- |
| `account_types` | 型定義（`MasterDataDTO`）には存在するが、現在フロントエンドコード内で参照箇所なし |
| `rating_bands` | 型定義には存在するが、現在フロントエンドコード内で参照箇所なし |

---

## `fetchMasterData` 呼び出し箇所

| ファイル | 呼び出し方 |
| --- | --- |
| `src/pages/songs/SongsList/SongsList.tsx` | `createResource(fetchMasterData)` |
| `src/pages/songs/WorldsendSongsList/WorldsendSongsList.tsx` | `createResource(fetchMasterData)` |
| `src/pages/songs/components/useSongDetailBase.ts` | `createResource(fetchMasterData)`。`SongDetail` などの詳細画面から利用。バージョン名解決は別途 `fetchVersions()` を利用 |
| `src/pages/songs/SongManagementPage.tsx` | `createResource(fetchMasterData)` |
| `src/pages/goals/GoalsList/GoalsList.tsx` | `Promise.all` 内で `fetchMasterData()` を並列実行。目標のバージョン条件は別途 `fetchVersions()` を利用 |
| `src/pages/users/UserRecord/UserRecord.tsx` | `createResource(fetchMasterData)`。バージョンフィルターとレコードメタ付与は別途 `fetchVersions()` を利用 |
| `src/pages/users/UserOverPower/UserOverPower.tsx` | `createResource(fetchMasterData)`。バージョン別集計と未解禁曲ダイアログは別途 `fetchVersions()` を利用 |

## `fetchVersions` 呼び出し箇所

| ファイル | 呼び出し方 |
| --- | --- |
| `src/pages/songs/components/useSongDetailBase.ts` | `createResource(fetchVersions)` |
| `src/pages/goals/GoalsList/GoalsList.tsx` | `Promise.all` 内で `fetchVersions()` を並列実行 |
| `src/pages/users/UserRecord/UserRecord.tsx` | `createResource(fetchVersions)` |
| `src/pages/users/UserOverPower/UserOverPower.tsx` | `createResource(fetchVersions)` |

各ページでそれぞれ独立してAPIを呼び出しており、共有キャッシュ機構はない。

---

## 補足：将来の分離に向けた考察

将来的には `/internal/master` で全マスタをまとめて取得するのではなく、画面ごとに必要なマスタデータだけを個別APIから取得する方針とする。

| フィールド | 分離の方向性 |
| --- | --- |
| `genres` | ジャンル一覧・表示順だけを返す個別APIを用意し、楽曲一覧ソート、WORLD'S END一覧ソート、OVER POWERジャンル集計、UserRecordフィルター、楽曲管理、目標フォームで共有する。`SongDTO.genre` は文字列名称で返却されるが、現在は表示順・ソート順に `sort_order` を使っているため、単純に楽曲一覧から一意のジャンル名セットを作るだけでは代替しきれない |
| `difficulties` | 難易度一覧だけを返す個別APIを用意し、楽曲詳細タブ、楽曲管理、目標フォーム、UserRecordフィルターで利用する。難易度名はゲーム仕様上の固定値に近いが、方針としてはフロント定数化ではなく個別API化を優先する |
| `versions` | **個別APIは達成済み**。`fetchVersions()` が `/internal/master/versions` を呼び出しており、UserRecord、UserOverPower、`useSongDetailBase`、目標関連はこのAPIを利用している。目標条件では DB 内部IDを保存・比較せず、`released_at` 昇順のリリース順番号を使うため、将来的に version API から `id` が消えても移行しやすい |
| `achievement_types` | 成果種別だけを返す個別APIを用意し、目標作成・編集ダイアログの選択肢として利用する。`goalForm.ts` には表示名の静的対応表があるが、選択肢の取得元は個別APIに分離する |
| `account_types` | フロントエンドでは現在未使用。利用する画面が出た時点でアカウント種別用の個別APIから取得する |
| `rating_bands` | フロントエンドでは現在未使用。利用する画面が出た時点でレーティング帯用の個別APIから取得する |

最も影響範囲が大きいのは **`/internal/master` の一括取得に複数画面が依存している** 点。`versions` は `/internal/master/versions` への移行が完了し、`masterData.versions` への実利用もなくなっているため、次の候補は `genres`・`difficulties`・`achievement_types` の用途別分離となる。

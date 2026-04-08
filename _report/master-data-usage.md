# マスタデータ参照箇所 調査レポート

**調査日**: 2026年04月05日  
**対象エンドポイント**: `GET /internal/master`

---

## マスタデータ概要

`/internal/master` が返すフィールドは以下のとおり。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `genres` | `MasterItemDTO[]` | ジャンル一覧（id, name） |
| `difficulties` | `MasterItemDTO[]` | 難易度一覧（id, name） |
| `versions` | `VersionDTO[]` | バージョン一覧（id, name, released_at） |
| `achievement_types` | `AchievementTypeDTO[]` | 成果種別一覧（code, label?, name?） |
| `account_types` | `MasterItemDTO[]` | アカウント種別一覧（id, name） |
| `rating_bands` | `RatingBandDTO[]` | レーティング帯一覧（id, label, min_inclusive, max_exclusive, sort_order） |

型定義: `src/types/api.ts`  
APIラッパー: `src/api/songs.ts` → `fetchMasterData()`

---

## フィールド別・参照箇所一覧

### `genres`（ジャンル一覧）

| ファイル | 用途 |
| --- | --- |
| `src/pages/songs/SongManagementPage.tsx` | 楽曲編集フォームでのジャンル選択（`genre_id` → `genre` 名への逆引き、および `toSongDraft`/`toWorldsendDraft` での `genre_id` 解決） |
| `src/pages/goals/utils/goalProgress.ts` | `filterRecordsByAttributes` でジャンルIDを名称に変換し、楽曲ジャンルと突合してレコードをフィルタリング |
| `src/pages/goals/utils/goalForm.ts` | `formatGoalAttributesLabel` でジャンルIDを表示名に変換（目標カードの属性ラベル生成） |
| `src/pages/goals/GoalsList/components/GoalFormDialog.tsx` | 目標作成・編集ダイアログでジャンル選択チェックボックスの選択肢として表示 |
| `src/pages/users/UserRecord/types/filterDefaults.ts` | `getMasterDataDefaults` でジャンル名一覧を全選択フィルターのデフォルト値として生成 |
| `src/pages/users/UserRecord/components/filterDialog/FilterSelectionPanel.tsx` | `GenreSection` へジャンル名配列を渡す |

### `difficulties`（難易度一覧）

| ファイル | 用途 |
| --- | --- |
| `src/pages/songs/SongDetail/SongDetail.tsx` | 楽曲が持つ譜面を判定し、タブ表示用の `availableDifficulties` を生成するために難易度順序リストとして使用 |
| `src/pages/songs/SongManagementPage.tsx` | `toSongDraft` で楽曲のchartをdifficultyのidと紐付けて編集用ドラフトを生成 |
| `src/pages/goals/utils/goalProgress.ts` | `filterRecordsByAttributes` で難易度IDを名称に変換し、レコード難易度と突合してフィルタリング |
| `src/pages/goals/utils/goalForm.ts` | `formatGoalAttributesLabel` で難易度IDを表示名に変換 |
| `src/pages/goals/GoalsList/components/GoalFormDialog.tsx` | 目標作成・編集ダイアログで難易度選択チェックボックスの選択肢として表示 |
| `src/pages/users/UserRecord/components/filterDialog/FilterSelectionPanel.tsx` | `DifficultySection` へ難易度名配列を渡す |

### `versions`（バージョン一覧）

| ファイル | 用途 |
| --- | --- |
| `src/pages/goals/utils/goalProgress.ts` | `resolveSongVersionId` で楽曲リリース日とバージョンの `released_at` を突合してバージョンIDを解決し、バージョンフィルタリングに使用 |
| `src/pages/goals/utils/goalForm.ts` | `formatGoalAttributesLabel` でバージョンIDを表示名に変換 |
| `src/pages/goals/GoalsList/components/GoalFormDialog.tsx` | 目標作成・編集ダイアログでバージョン選択チェックボックスの選択肢として表示 |

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
| `src/pages/songs/SongDetail/SongDetail.tsx` | `createResource(fetchMasterData)` |
| `src/pages/songs/SongManagementPage.tsx` | `createResource(fetchMasterData)` |
| `src/pages/goals/GoalsList/GoalsList.tsx` | `Promise.all` 内で `fetchMasterData()` を並列実行 |
| `src/pages/users/UserRecord/UserRecord.tsx` | `createResource(fetchMasterData)` |

各ページでそれぞれ独立してAPIを呼び出しており、共有キャッシュ機構はない。

---

## 補足：将来の除去に向けた考察

各フィールドについて、マスタAPIに依存せずに済む代替手段を整理する。

| フィールド | 除去の方向性 |
| --- | --- |
| `genres` | `SongDTO.genre` は文字列名称で返却される。楽曲一覧から一意のジャンル名セットを生成すれば、IDに依存しない形でフィルターと表示ラベルを構築できる。ただし目標の属性（`GoalAttributes.genre`）が現在IDベースであるため、API仕様変更も必要 |
| `difficulties` | 難易度名（BASIC / ADVANCED / EXPERT / MASTER / ULTIMA）はゲーム仕様上の固定値。ハードコードまたは定数ファイルで管理し、マスタ依存を廃止できる |
| `versions` | `versionConverter.ts` に `CHUNITHM_VERSIONS` 定数が既に存在する。目標バージョンフィルタリングもこちらを使えばマスタ不要になる。ただし目標の属性（`GoalAttributes.ver`）が現在IDベースであるため、API仕様変更も必要 |
| `achievement_types` | `goalForm.ts` に `GOAL_ACHIEVEMENT_TYPE_LABELS` として成果種別コードと表示名の対応表が既に静的定義されている。セレクト選択肢もこちらから生成すれば依存を廃止できる |
| `account_types` | フロントエンドでは現在未使用 |
| `rating_bands` | フロントエンドでは現在未使用。将来使う場合もフロントエンド定数として持てる可能性が高い |

最も影響範囲が大きいのは **`genres`・`versions` がIDベースで目標属性に埋め込まれている** 点。これを廃止するには `GoalAttributes.genre`・`GoalAttributes.ver` をID参照から名称文字列または他の識別子へ変更するAPIおよびDB設計の変更を伴う。

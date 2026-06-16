# フロントエンド リファクタリング観点整理 (2026-06-17 版)

本ドキュメントは、`chunisupport-front` の現行実装を確認し、改善点が現在も有効かを棚卸しした結果をまとめたものです。
前回レビュー（2026-06-01）から IndexedDB キャッシュ導入・UserRecord の pageModel 化などが進んだため、状況を再確認し、解消済み項目の削除と新規観点の追記を行いました。

## 注意
解消された点は解消済みと書くのではなく、必ず削除してください。

## 優先度
- **Critical**: 誤認証・誤権限制御・誤遷移につながるもの
- **High**: 責務集中により変更時の不具合混入リスクが高いもの
- **Medium**: 改修コストや後方互換性コストを押し上げるもの
- **Low**: 定数整理、コメント整理、規律面の改善事項

## 対象範囲
- ユーザーページ: `src/pages/users/UserPage`
- レコード画面: `src/pages/users/UserRecord`, `src/pages/users/WorldsendRecord`
- OVER POWER 画面: `src/pages/users/UserOverPower`
- 目標機能: `src/pages/goals/GoalsList`
- 管理画面: `src/pages/songs/SongManagementPage`
- 設定画面: `src/pages/settings/Settings`
- クライアントキャッシュ層: `src/lib/db/cacheDB.ts`, `src/repositories/*`, `src/usecases/cache/*`
- 共通定数/表示ルール: `src/utils/difficultyUtils.ts`, `src/utils/scoreRank.ts`, `src/pages/users/components/recordStyleClasses.ts`

## 全体所見 (2026-06-17 更新)
1. `UserRecord` は pageModel 導入・IndexedDB 永続化・キャッシュ付き楽曲取得により **約580行 → 約210行** に縮小。旧主戦場だった F04/F05 のリスクは大幅に低下した。
2. 永続化は **サーバー API（保存フィルター）+ IndexedDB（画面設定・API キャッシュ）+ `themePreference`（テーマのみ localStorage）** に整理された。旧 F05（localStorage 型検証不足）は解消済み。
3. **IndexedDB キャッシュ層（Dexie）** が新たな主戦場。無効化の網羅性・層依存・usecase テスト不足が F13 として浮上した。
4. 大規模ファイルは `SongManagementPage`（1748行）→ `GoalFormDialog`（1126行）の順で突出。F11 に F14 が加わった。
5. `WorldsendRecord` は UserRecord 改善の横展開が未着手。pageModel 未導入・storage 重複・メタ付与ロジックの重複が残る（F15/F16）。
6. OVER POWER 画面は集計補助関数が `UserOverPower.tsx`（598行）に多数残っており、機能追加時の影響範囲が広がっている（F09/F12）。
7. 難易度定数の重複（DIFFICULTY_ORDER）、TODO/FIXME の整理、MasterData 直接参照は前回からほぼ無変更。

---

## サマリ

| ID | タイトル | 重大度 | 主な対象 | ステータス |
|---|---|---|---|---|
| **REF-F04** | UserRecord ページロジックの責務集中 | **Medium** | `UserRecord.tsx`, `pageModel.ts`, `FilterSelectionPanel.tsx` | 大幅改善・残タスク継続 |
| **REF-F07** | 表示用定数/判定ロジックの整理不足 | **Low** | `difficultyUtils.ts`, `filterDefaults.ts`, `sorting.ts` | 状況継続 |
| **REF-F08** | TODO/FIXME の残置 | **Low** | `NavBar.tsx`, `UserPage/components/*`, `filterDefaults.ts` | 状況継続（1件解消） |
| **REF-F09** | UserOverPower ページロジックの責務集中 | **High** | `UserOverPower.tsx`, `OverPowerSummaryGraph.tsx` | 状況継続 |
| **REF-F10** | DIFFICULTY_ORDER の重複定義と難易度定数一元化不足 | **Medium** | `sorting.ts`, `overpowerSummary.ts`, `difficultyUtils.ts` | 状況継続 |
| **REF-F11** | SongManagementPage.tsx の責務集中 | **High** | `SongManagementPage.tsx` (1748行) | 状況継続・拡大 |
| **REF-F12** | テスト容易性の低いページ内補助関数群 | **Medium** | `UserOverPower.tsx`, `WorldsendRecord.tsx` | 状況継続・対象拡大 |
| **REF-F13** | クライアントキャッシュ層の設計・整合性 | **High** | `cacheDB.ts`, `usecases/cache/*`, `api/songs.ts`, `Settings.tsx` | **新規** |
| **REF-F14** | GoalFormDialog.tsx の責務集中 | **High** | `GoalFormDialog.tsx` (1126行) | **新規** |
| **REF-F15** | WorldsendRecord の pageModel 未整備と UserRecord との重複 | **Medium** | `WorldsendRecord.tsx`, `UserRecord/*` | **新規** |
| **REF-F16** | 保存フィルター storage の standard/worldsend 重複 | **Medium** | `UserRecord/utils/storage.ts`, `WorldsendRecord/utils/storage.ts` | **新規** |
| **REF-F17** | MasterDataDTO 直接参照の継続 | **Medium** | 複数ページ・コンポーネント | **新規** |
| **REF-F18** | Settings.tsx の責務集中 | **Medium** | `Settings.tsx` (611行) | **新規** |

---

## 詳細

### REF-F04: UserRecord ページロジックの責務集中
- **最終確認日**: 2026-06-17
- **現状**:
  - `FilterDialog`、`FilterToolbar`、`FilterStats`、`RecordTable` などへの UI 分割は進んでいる。
  - ソート・フィルタ検索・統計集計は `utils/` に切り出されテスト済み。
  - レコード導出・フィルタ適用・ソート・統計は `useUserRecordPageModel`（`pageModel.ts`）に分離済み。
  - `UserRecord.tsx` は **約580行 → 約210行** に縮小。IndexedDB 経由のフィルター/列永続化、`useSongsData` + キャッシュ付き楽曲取得へ移行済み。
  - 残存: フィルター・ダイアログ・列・ソートの **UI 状態** がコンポーネント内。`fetchMasterData` / `fetchVersions` の直接取得。`FilterSelectionPanel.tsx`（569行）が肥大。
- **影響**:
  - 全体リスクは前回より低下。フィルター UI・列設定・マスタ依存初期化の変更時に回帰余地あり。
- **対応方針**:
  - 残 UI 状態を hook/pageModel へ段階移譲。
  - `FilterSelectionPanel` のセクション分割を F04 と一体で検討。
  - ダイアログ開閉状態と保存フィルタ操作の置き場所を整理し、ページコンポーネントはリソース取得と描画接続に寄せる。

### REF-F07: 表示用定数/判定ロジックの整理不足
- **最終確認日**: 2026-06-17
- **現状**:
  - スコアランク定義は `src/utils/scoreRank.ts` に寄せられ、表示色は `recordStyleClasses.ts` に整理されている。
  - 難易度の短縮名、クエリ値、バッジ色、カード境界色は `difficultyUtils.ts` にまとまっている。
  - ただし難易度ソート順 `DIFFICULTY_ORDER` は `sorting.ts` と `overpowerSummary.ts` に別表現で残存。
  - ランプ選択肢は `filterDefaults.ts` に残っており、サーバ由来データにすべきかを迷う TODO も残っている。
- **影響**:
  - 表示名、ソート順、初期選択肢、色の変更時に、修正箇所の探索コストが残る。
- **対応方針**:
  - 難易度は「表示名・短縮名・クエリ値・色・順序」を 1 モジュールに統合する（F10 と合わせて）。
  - ランプは「表示用定義」「フィルタ既定値」「ソート順」を分離し、選択肢そのものの出所を明確にする。

### REF-F08: TODO/FIXME の残置
- **最終確認日**: 2026-06-17
- **現状**:
  - `NavBar` にレイアウト TODO が残っている。
  - `UserNameplate` に OVER POWER ゲージの TODO が残っている（称号背景画像 TODO は解消済み）。
  - `UserRecordCard` にデザイン判断の FIXME が残っている。
  - `filterDefaults.ts` に定数の出所や命名に関する TODO が 2 件残っている。
  - プロジェクト全体で実質タスク系 TODO/FIXME は **5件**。
- **影響**:
  - UI 演出、設計課題、データソース課題が同じ TODO として混在しており、優先順位が見えにくい。
- **対応方針**:
  - `refactor` 対象と `design backlog` 対象を分けて整理する。
  - コメントとして残す場合は、未着手理由と次の判断条件を短く添える。

### REF-F09: UserOverPower ページロジックの責務集中
- **最終確認日**: 2026-06-17
- **現状**:
  - `UserOverPower.tsx`（598行）にデータ取得、未解禁曲の権限制御、タブ遷移、OVER POWER 集計、グラフ用の曲数/譜面数分布生成、保存処理がまとまっている。
  - `buildLockedSongLookup`、`buildSongEntriesBySummaryTab`、`buildRecordsBySummaryTab`、`buildGraphRows`、`buildSongBasedGraphRows` など **15関数以上** がページ内ローカル定義のまま。
  - `src/usecases/overpower` には `overpowerSummary.test.ts` と `lockedSongsBatch.test.ts` があり、基礎集計と保存 payload はテスト済み。グラフ生成系の専用テストはなし。
- **影響**:
  - OVER POWER の「曲数ベース」と「譜面数ベース」の切り替え、未解禁設定の反映、バージョン/ジャンル分類の仕様変更時に、UI コンポーネント内の変更量が増える。
- **対応方針**:
  - グラフ行生成と分類ロジックを `usecases/overpower` または `UserOverPower/utils` に切り出す。
  - 曲数ベース/譜面数ベース、未解禁曲、ULTIMA 未解禁、ジャンル不明、バージョン不明のケースをテストで固定する。
  - `UserOverPower.tsx` はリソース取得、画面状態、イベントハンドラ、描画の接続に寄せる。

### REF-F10: DIFFICULTY_ORDER の重複定義と難易度定数一元化不足
- **最終確認日**: 2026-06-17
- **現状**:
  - `DIFFICULTY_ORDER` が `UserRecord/utils/sorting.ts`（`Record<string, number>`）と `usecases/overpower/overpowerSummary.ts`（配列）の 2 箇所で別表現のまま定義されている。
  - `difficultyUtils.ts` には短縮名・クエリ値・色系は集約されているが、ソート順序は未集約。
- **影響**:
  - 難易度順序や表示ルールの変更時に、修正漏れや不整合のリスク。
- **対応方針**:
  - `difficultyUtils.ts`（または新規 `src/constants/difficulty.ts`）に「表示名・短縮名・クエリ値・色・ソート順」を一元管理。
  - 既存 2 箇所の `DIFFICULTY_ORDER` を削除し、共通参照へ置き換え。

### REF-F11: SongManagementPage.tsx の責務集中
- **最終確認日**: 2026-06-17
- **現状**:
  - **1748行**（前回 1627行）とプロジェクト内で突出して大きい単一ファイル。
  - 楽曲/Worldsend 管理の CRUD、編集フォーム状態、API 呼び出し、削除/復元ダイアログ、検索・フィルタなどが一箇所に集約。
- **影響**:
  - 管理機能とはいえ、変更時の影響範囲が広く、テスト追加・リファクタリングのハードルが高い。
- **対応方針**:
  - ドメイン別（Song / Worldsend）に分割、または usecases 層へのロジック抽出を検討。
  - フォーム状態管理やダイアログを別コンポーネント/primitive へ切り出し。

### REF-F12: テスト容易性の低いページ内補助関数群
- **最終確認日**: 2026-06-17
- **現状**:
  - `UserOverPower.tsx` 内の `getScoreBand` / `getComboBand` / `buildGraphRows` 系など、ページローカルで定義され export されていない補助関数が多い。
  - `WorldsendRecord.tsx`（441行）も pageModel 未導入で、フィルタ・ソート・統計がページ内 `createMemo` に直書き。`attachWorldsendSongMetaToRecords` が `recordMerger.ts` の `attachSongMetaToRecords` と類似ロジックを重複。
- **影響**:
  - 仕様変更時の退行検知が難しく、F09 の問題を拡大させる。
- **対応方針**:
  - 集計・変換ロジックは原則 usecases または utils へ移動し、純粋関数としてテスト可能にする。
  - ページコンポーネントは「接続と描画」に徹する規律を徹底。

---

## 追加観点（2026-06-17 レビュー追記）

### REF-F13: クライアントキャッシュ層（Dexie/IndexedDB）の設計・整合性
- **最終確認日**: 2026-06-17
- **現状**:
  - 楽曲・ユーザー API・画面設定の IndexedDB キャッシュが新規追加済み（`cacheDB.ts`, `repositories/*`, `usecases/cache/*`）。
  - `songsData` が `fetchAllSongsWithCache` / `fetchWorldsendSongsWithCache` を利用。`UserPage` が `fetchUserRecordWithCache` / `fetchUserRatingWithCache` を利用。
  - `cacheRepositories.test.ts` は repository 層のみテスト。`usecases/cache/*.test.ts` は **0件**。
- **課題**:
  1. `cacheDB.ts` が `pages/users/UserRecord`・`WorldsendRecord` の型に依存しており、インフラ層→ページ層の逆依存がある。
  2. `clearClientCache` は IndexedDB のみ削除。`api/songs.ts` のメモリキャッシュ（`cachedMasterDataResponse` 等）と `songsData` シングルトンは残存する。
  3. ログアウト（`NavBar`）・退会（`Settings.handleDeleteAccount`）では `clearClientCache` を呼ぶが、**プレイヤーデータ削除**（`handleDeletePlayerData`）では呼ばれない。
- **影響**:
  - セッション内で古いユーザー API キャッシュや楽曲ストアが残る可能性。層依存によりキャッシュ型変更の影響範囲が広い。
- **対応方針**:
  - `cacheDB` の型を `types/` へ移動し、ページ型への依存を解消する。
  - `clearClientCache` をメモリキャッシュ・ストア無効化まで拡張する。プレイヤーデータ削除時も呼び出す。
  - `fetch*WithCache` のフォールバック経路を統合テスト化する。

### REF-F14: GoalFormDialog.tsx の責務集中
- **最終確認日**: 2026-06-17
- **現状**:
  - **1126行**とプロジェクト内で 2 番目に大きい単一ファイル。
  - 作成/編集フォーム・達成条件 UI・進捗プレビュー・`MasterDataDTO` 直接参照が単一ファイルに集約。
  - `goalForm.ts` / `goalProgress.ts` に一部ロジックあり。`GoalFormDialog` 専用テストはなし。
- **影響**:
  - 目標機能拡張時の影響範囲が F11 に次ぐ規模。
- **対応方針**:
  - 達成条件セクション・フォーム state hook・プレビュー表示を分割する。
  - `MasterDataDTO` 依存をカプセル化単位へ置換する。

### REF-F15: WorldsendRecord の pageModel 未整備と UserRecord との重複
- **最終確認日**: 2026-06-17
- **現状**:
  - UserRecord は pageModel + 約210行コンポーネント化済み。
  - WorldsendRecord は **pageModel なし**。フィルタ復元・列永続化・`createMemo` 導出がページ内直書き。
  - `attachWorldsendSongMetaToRecords` が `recordMerger.ts` の `attachSongMetaToRecords` と類似ロジックを重複。
- **影響**:
  - レコード画面仕様変更時に二重メンテ。F04 改善の恩恵が Worldsend に波及していない。
- **対応方針**:
  - `useWorldsendRecordPageModel` を導入する。
  - メタ付与を `utils/` へ共通化し、F04 完了パターンを横展開する。

### REF-F16: 保存フィルター storage の standard/worldsend 重複
- **最終確認日**: 2026-06-17
- **現状**:
  - `UserRecord/utils/storage.ts`（120行）と `WorldsendRecord/utils/storage.ts`（122行）が、`toSaved*` / `buildSaved*Request` / CRUD を filter_type・schema_version・バリデータのみ差分の **ほぼコピペ** で保持。
  - いずれもサーバー API 経由で `schema_version` による型検証を行う（旧 F05 の localStorage 課題はここでは解消済み）。
- **影響**:
  - API 仕様変更時に 2 箇所修正が必要。
- **対応方針**:
  - `repositories/recordFilterRepository.ts` 等へジェネリック化し、バリデーション関数を DI する。

### REF-F17: MasterDataDTO 直接参照の継続
- **最終確認日**: 2026-06-17
- **現状**:
  - `AGENTS.md` は新規の `fetchMasterData` 直接参照を禁止している。
  - `UserRecord.tsx`、`UserOverPower.tsx`、`SongManagementPage.tsx`、`GoalsList.tsx`、`SongsList.tsx`、`WorldsendSongsList.tsx`、`useSongDetailBase.ts`、`GoalFormDialog.tsx`、`FilterSelectionPanel.tsx` など **7ファイル以上** が `createResource(fetchMasterData)` または `MasterDataDTO` props で全量参照。
  - `fetchVersions` は API 層でセッションキャッシュ済みだが、ページからは未カプセル化。
- **影響**:
  - マスタ構造変更の波及範囲が広い。新規画面でも同パターンが増殖しやすい。
- **対応方針**:
  - 用途別 hook（例: `useGenreOptions`、`useDifficultyOptions`）へ段階移行する。
  - 新規画面では `MasterDataDTO` 直渡しを禁止する。

### REF-F18: Settings.tsx の責務集中
- **最終確認日**: 2026-06-17
- **現状**:
  - **611行**。プライバシー・API トークン・プレイヤーデータ削除・アカウント退会・セクションルーティングが単一ファイルに集約。
  - F13 で指摘したキャッシュクリア漏れ（プレイヤーデータ削除）も本ファイル内にある。
- **影響**:
  - 設定項目追加のたびに肥大化する。
- **対応方針**:
  - セクション単位のコンポーネント化 + 各セクション用 hook へ分割する。

---

## 主要ファイル行数（2026-06-17 実測）

| ファイル | 行数 | 備考 |
|---|---:|---|
| `SongManagementPage.tsx` | 1748 | 最大（前回 1627行、+121行） |
| `GoalFormDialog.tsx` | 1126 | 新規大規模 |
| `types/api.ts` | 691 | |
| `Settings.tsx` | 611 | |
| `UserOverPower.tsx` | 598 | グラフ補助関数がページ内 |
| `FilterSelectionPanel.tsx` | 569 | UserRecord サブ |
| `UserRecord.tsx` | **210** | **大幅縮小**（前回 〜580行） |
| `WorldsendRecord.tsx` | 441 | pageModel なし |
| `pageModel.ts` | 91 | |
| `cacheDB.ts` | 107 | ページ型に依存 |

---

## 推奨着手順（2026-06-17 更新）

1. **クライアントキャッシュ層の整合性確保**
   - `REF-F13` を進め、キャッシュ無効化の網羅化（ログアウト/退会/プレイヤーデータ削除）と層依存の整理を行う。
2. **難易度定数の一元化と重複解消**
   - `REF-F10` + `REF-F07` を合わせて進め、`DIFFICULTY_ORDER` の重複と散在を解消する。
3. **WorldsendRecord への UserRecord パターン横展開**
   - `REF-F15` + `REF-F16` として、pageModel 導入と storage 共通化を行う。
4. **UserOverPower の集計補助関数切り出し**
   - `REF-F09` + `REF-F12` として、グラフ行生成と分類ロジックをテスト可能な層へ移す。
5. **大規模画面の分割**
   - `REF-F14`（GoalFormDialog）と `REF-F11`（SongManagementPage）の責務集中を解消する。
6. **UserRecord 残タスク**
   - `REF-F04` として、UI 状態の hook 化・`FilterSelectionPanel` 分割を行う。
7. **横断的整理**
   - `REF-F17`（マスタカプセル化）、`REF-F18`（Settings 分割）、`REF-F08`（TODO 整理）を後追いで進める。

---

## まとめ
- 主戦場は **IndexedDB キャッシュ層（F13）** と **大規模画面の分割（F11/F14）** に移行しつつ、UserRecord（F04）は大幅改善済み。
- `UserRecord` は pageModel 化・IndexedDB 永続化により約210行に縮小。残りは UI 状態と `FilterSelectionPanel` の分割。
- `WorldsendRecord` は UserRecord 改善の横展開が未着手（F15/F16）。
- `UserOverPower` は usecase 層のテストはあるものの、ページ内に残るグラフ分類ロジックが大きく、次の分割候補（F09/F12）。
- 旧 F05（localStorage 型検証不足）はサーバー API + IndexedDB 移行により **解消済みのため削除**。
- 定数整理と TODO/FIXME 整理は低優先度だが、ページ責務分割と合わせて進めると効率が良い。

---

**参考**: 本レビューは 2026-06-17 時点のコードベース（UserRecord 約210行、SongManagementPage 1748行、GoalFormDialog 1126行、TODO/FIXME 5件、DIFFICULTY_ORDER 重複確認済み、localStorage は `themePreference.ts` のみ）に基づく。次回レビュー時は本ドキュメントの日付と各項目の「最終確認日」を更新すること。
# フロントエンド リファクタリング観点整理 (2026-05-18 現在)

本ドキュメントは、`chunisupport-front` の現行実装を確認し、改善点が現在も有効かを棚卸しした結果をまとめたものです。

## 注意
解消された点は解消済みと書くのではなく、必ず削除してください。

## 優先度
- **Critical**: 誤認証・誤権限制御・誤遷移につながるもの
- **High**: 責務集中により変更時の不具合混入リスクが高いもの
- **Medium**: 改修コストや後方互換性コストを押し上げるもの
- **Low**: 定数整理、コメント整理、規律面の改善事項

## 対象範囲
- ユーザーページ: `src/pages/users/UserPage`
- レコード画面: `src/pages/users/UserRecord`
- OVER POWER 画面: `src/pages/users/UserOverPower`
- 共通定数/表示ルール: `src/utils/difficultyUtils.ts`, `src/utils/scoreRank.ts`, `src/pages/users/components/recordStyleClasses.ts`

## 全体所見
1. `UserRecord` のページロジック集中は一部緩和され、ソートとフィルタ検索のテストは追加済みです。
2. 一方で `localStorage` 永続化の型検証不足、`recordStats.ts` / `storage.ts` のテスト不足、ページモデル未分離は引き続き未解消です。
3. OVER POWER 画面は集計補助関数が `UserOverPower.tsx` に多数残っており、機能追加時の影響範囲が広がっています。
4. 表示定数の共通化は進んでいますが、難易度順・ランプ選択肢・TODO/FIXME の整理はまだ改善余地があります。

---

## ステータス付きサマリ

| ID | タイトル | 重大度 | ステータス | 主な対象 |
|---|---|---|---|---|
| **REF-F04** | UserRecord ページロジックの責務集中 | **High** | **一部改善** | `src/pages/users/UserRecord/UserRecord.tsx`, `src/pages/users/UserRecord/utils/*` |
| **REF-F05** | フィルタ永続化データの型検証不足 | **Medium** | **継続** | `src/pages/users/UserRecord/utils/storage.ts` |
| **REF-F06** | レコード画面ロジックのテスト不足 | **Medium** | **一部改善** | `src/pages/users/UserRecord/utils/recordStats.ts`, `src/pages/users/UserRecord/utils/storage.ts` |
| **REF-F07** | 表示用定数/判定ロジックの整理不足 | **Low** | **一部改善** | `src/utils/difficultyUtils.ts`, `src/pages/users/UserRecord/types/filterDefaults.ts`, `src/pages/users/UserRecord/utils/sorting.ts` |
| **REF-F08** | TODO/FIXME の残置 | **Low** | **継続** | `src/components/NavBar/NavBar.tsx`, `src/pages/users/UserPage/components/*`, `src/pages/users/UserRecord/types/filterDefaults.ts` |
| **REF-F09** | UserOverPower ページロジックの責務集中 | **High** | **継続** | `src/pages/users/UserOverPower/UserOverPower.tsx`, `src/pages/users/UserOverPower/components/OverPowerSummaryGraph.tsx` |

---

## 詳細

### REF-F04: UserRecord ページロジックの責務集中
- **ステータス**: 一部改善
- **現状**:
  - `FilterDialog`、`FilterToolbar`、`FilterStats`、`RecordTable` などへの UI 分割は進んでいます。
  - ソート関連は `utils/sorting.ts` に切り出され、URL ソート読取、状態遷移、ソート比較はテスト済みです。
  - フィルタ検索も `utils/filtering.ts` に切り出され、タイトル・読み・アーティスト検索のテストが追加されています。
  - ただし `UserRecord.tsx` には依然としてデータ取得、マスタデータ依存の初期化、フィルタ状態、統計計算、ダイアログ状態、件数表示が集約されています。
- **影響**:
  - ソートや検索仕様変更時の影響範囲は狭まりました。
  - ただしページ全体の状態遷移がコンポーネント内に残っているため、フィルタ初期化・統計・表示列設定の変更時に回帰リスクがあります。
- **対応方針**:
  - `useUserRecordPageModel` のようなページモデル層へ、取得済みデータから導出される状態を集約する。
  - 件数、統計、初期フィルタ生成、表示列状態をページコンポーネントから順に押し出す。

### REF-F05: フィルタ永続化データの型検証不足
- **ステータス**: 継続
- **現状**:
  - `loadSavedFilters()` は `localStorage` から取り出した JSON を `JSON.parse` した結果のまま返しています。
  - `saveNewFilter()` / `deleteFilter()` にも `schemaVersion` や migration はありません。
- **影響**:
  - 不正 JSON は空配列になりますが、不正 shape の JSON は `SavedFilter[]` として後段へ流れる余地があります。
  - 将来的に `FilterState` を変更した際、保存済みデータとの互換性管理が難しくなります。
- **対応方針**:
  - `parseSavedFilters` を追加し、配列 shape と各 `SavedFilter` の最低限の型検証を行う。
  - `schemaVersion` を導入し、後方互換が必要になった時点で migration を追加できる構造にしておく。

### REF-F06: レコード画面ロジックのテスト不足
- **ステータス**: 一部改善
- **現状**:
  - `updatedAt.ts`、`sorting.ts`、`filtering.ts`、`columns.ts`、`constDisplay.ts`、`justiceCount.ts` には対応するテストがあります。
  - 一方で `recordStats.ts` と `storage.ts` に対応する `*.test.ts` は存在しません。
  - `filtering.test.ts` は検索系の主要ケースを押さえていますが、難易度、ジャンル、バージョン、譜面定数、スコア、ランプ、未プレイ除外の組み合わせは未固定です。
- **影響**:
  - 統計集計、`localStorage` 復元、フィルタ条件の組み合わせに対する退行検知が弱いです。
  - ページモデル化を進める際、既存挙動を固定するテストが不足しています。
- **対応方針**:
  - 優先順は `getRecordStats`、`loadSavedFilters` / `saveNewFilter` / `deleteFilter`、`isRecordMatched` の条件別追加ケース。
  - 先に純粋関数テストを置いてからページモデル化へ進む。

### REF-F07: 表示用定数/判定ロジックの整理不足
- **ステータス**: 一部改善
- **現状**:
  - スコアランク定義は `src/utils/scoreRank.ts` に寄せられ、表示色は `src/pages/users/components/recordStyleClasses.ts` に整理されています。
  - 難易度の短縮名、クエリ値、バッジ色、カード境界色は `src/utils/difficultyUtils.ts` にまとまっています。
  - ただし難易度ソート順 `DIFFICULTY_ORDER` は `src/pages/users/UserRecord/utils/sorting.ts` に別途残っています。
  - ランプ選択肢は `src/pages/users/UserRecord/types/filterDefaults.ts` に残っており、サーバ由来データにすべきかを迷う TODO も残っています。
- **影響**:
  - 表示名、ソート順、初期選択肢、色の変更時に、修正箇所の探索コストが残ります。
- **対応方針**:
  - 難易度は「表示名・短縮名・クエリ値・色・順序」を 1 モジュールに統合する。
  - ランプは「表示用定義」「フィルタ既定値」「ソート順」を分離し、選択肢そのものの出所を明確にする。

### REF-F08: TODO/FIXME の残置
- **ステータス**: 継続
- **現状**:
  - `NavBar` にレイアウト TODO が残っています。
  - `UserNameplate` に称号背景画像と OVER POWER ゲージの TODO が残っています。
  - `UserRecordCard` にデザイン判断の FIXME が残っています。
  - `filterDefaults.ts` に定数の出所や命名に関する TODO が残っています。
- **影響**:
  - UI 演出、設計課題、データソース課題が同じ TODO として混在しており、優先順位が見えにくいです。
- **対応方針**:
  - `refactor` 対象と `design backlog` 対象を分けて整理する。
  - コメントとして残す場合は、未着手理由と次の判断条件を短く添える。

### REF-F09: UserOverPower ページロジックの責務集中
- **ステータス**: 継続
- **現状**:
  - `UserOverPower.tsx` にデータ取得、未解禁曲の権限制御、タブ遷移、OVER POWER 集計、グラフ用の曲数/譜面数分布生成、保存処理がまとまっています。
  - `buildLockedSongLookup`、`buildSongEntriesBySummaryTab`、`buildRecordsBySummaryTab`、`buildGraphRows`、`buildSongBasedGraphRows` などのページローカル関数は、仕様上重要ですがテストから直接参照しにくい位置にあります。
  - `src/usecases/overpower` には `overpowerSummary.test.ts` と `lockedSongsBatch.test.ts` があり、基礎集計と保存 payload はテスト済みです。
- **影響**:
  - OVER POWER の「曲数ベース」と「譜面数ベース」の切り替え、未解禁設定の反映、バージョン/ジャンル分類の仕様変更時に、UI コンポーネント内の変更量が増えます。
  - 集計補助関数がページ内にあるため、退行検知を追加しづらいです。
- **対応方針**:
  - グラフ行生成と分類ロジックを `usecases/overpower` または `UserOverPower/utils` に切り出す。
  - 曲数ベース/譜面数ベース、未解禁曲、ULTIMA 未解禁、ジャンル不明、バージョン不明のケースをテストで固定する。
  - `UserOverPower.tsx` はリソース取得、画面状態、イベントハンドラ、描画の接続に寄せる。

---

## 推奨着手順

1. **UserRecord の未テスト純粋関数を固定**
   - `recordStats.ts` と `storage.ts` のテストを追加し、フィルタ検索の条件別ケースも補強する。
2. **保存データの型安全化**
   - `REF-F05` を進め、`localStorage` の破損耐性と将来の互換性を確保する。
3. **UserRecord のページモデル化**
   - `REF-F04` の残タスクとして、件数・統計・フィルタ初期化・表示列状態をページ責務から分離する。
4. **UserOverPower の集計補助関数切り出し**
   - `REF-F09` として、グラフ行生成と分類ロジックをテスト可能な層へ移す。
5. **定数整理と TODO/FIXME 整理**
   - `REF-F07`, `REF-F08` を後追いで整える。

## まとめ
- 現在の主戦場は `UserRecord` と `UserOverPower` 周辺です。
- `UserRecord` はソート・検索・表示列などのテストが増えていますが、保存データと統計集計のテスト、ページモデル化が残っています。
- `UserOverPower` は usecase 層のテストはあるものの、ページ内に残るグラフ分類ロジックが大きく、次の分割候補です。
- 定数整理と TODO/FIXME 整理は低優先度ですが、ページ責務分割と合わせて進めると効率が良いです。

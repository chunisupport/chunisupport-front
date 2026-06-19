# フロントエンド リファクタリング観点整理 (2026-05-18 版 / レビュー追記 2026年時点)

本ドキュメントは、`chunisupport-front` の現行実装を確認し、改善点が現在も有効かを棚卸しした結果をまとめたものです。
2026年レビュー時点で全項目の状況を再確認し、見落とし点を追加しました。

## 注意
解消された点は解消済みと書くのではなく、必ず削除してください。
本レビュー追記時点（2026年時点）でも、REF-F04〜F09 の全項目が未解消または状況継続しています。

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
- （レビュー追記）その他大規模ファイル: `src/pages/songs/SongManagementPage.tsx` など

## 全体所見 (2026年レビュー追記時点で更新)
1. `UserRecord` のページロジック集中は一部緩和され、ソート、フィルタ検索、統計集計、保存データ操作のテストは追加済みです。
2. 一方で `localStorage` 永続化の型検証不足とページモデル化の残タスクは引き続き改善余地があります。
3. OVER POWER 画面は集計補助関数が `UserOverPower.tsx` に多数残っており、機能追加時の影響範囲が広がっています。
4. 表示定数の共通化は進んでいますが、難易度順・ランプ選択肢・TODO/FIXME の整理はまだ改善余地があります。
5. （レビュー追記）上記に加え、難易度関連定数の重複定義（DIFFICULTY_ORDER）、SongManagementPage.tsx の突出した大規模化（1627行）、およびテスト容易性の低いページ内ロジックの増加傾向が見落としとして確認されました。
6. 2026年レビュー時点でも、REF-F04〜F09 の主要課題はすべて状況継続中です。

---

## サマリ

| ID | タイトル | 重大度 | 主な対象 |
|---|---|---|---|
| **REF-F04** | UserRecord ページロジックの責務集中 | **High** | `src/pages/users/UserRecord/UserRecord.tsx`, `src/pages/users/UserRecord/utils/*` |
| **REF-F05** | フィルタ永続化データの型検証不足 | **Medium** | `src/pages/users/UserRecord/utils/storage.ts` |
| **REF-F07** | 表示用定数/判定ロジックの整理不足 | **Low** | `src/utils/difficultyUtils.ts`, `src/pages/users/UserRecord/types/filterDefaults.ts`, `src/pages/users/UserRecord/utils/sorting.ts` |
| **REF-F08** | TODO/FIXME の残置 | **Low** | `src/components/NavBar/NavBar.tsx`, `src/pages/users/UserPage/components/*`, `src/pages/users/UserRecord/types/filterDefaults.ts` |
| **REF-F09** | UserOverPower ページロジックの責務集中 | **High** | `src/pages/users/UserOverPower/UserOverPower.tsx`, `src/pages/users/UserOverPower/components/OverPowerSummaryGraph.tsx` |
| **REF-F10** (追記) | DIFFICULTY_ORDER の重複定義と難易度定数一元化不足 | **Medium** | `src/pages/users/UserRecord/utils/sorting.ts`, `src/usecases/overpower/overpowerSummary.ts`, `src/utils/difficultyUtils.ts` |
| **REF-F11** (追記) | SongManagementPage.tsx の責務集中 | **High** | `src/pages/songs/SongManagementPage.tsx` (1627行) |
| **REF-F12** (追記) | テスト容易性の低いページ内補助関数群の増加傾向 | **Medium** | `src/pages/users/UserOverPower/UserOverPower.tsx` ほか |

---

## 詳細

### REF-F04: UserRecord ページロジックの責務集中
- **現状**:
  - `FilterDialog`、`FilterToolbar`、`FilterStats`、`RecordTable` などへの UI 分割は進んでいます。
  - ソート関連は `utils/sorting.ts` に切り出され、URL ソート読取、状態遷移、ソート比較はテスト済みです。
  - フィルタ検索も `utils/filtering.ts` に切り出され、タイトル・読み・アーティスト検索のテストが追加されています。
  - レコードメタ付与、フィルタ適用、ソート、件数、統計、ソート変更処理は `utils/pageModel.ts` の `useUserRecordPageModel` に分離されています。
  - ただし `UserRecord.tsx` には依然としてデータ取得、マスタデータ依存の初期化、フィルタ状態、ダイアログ状態、表示列状態が集約されています。
- **影響**:
  - ソートや検索仕様変更時の影響範囲は狭まりました。
  - ただしページ全体の状態遷移がコンポーネント内に残っているため、フィルタ初期化・表示列設定・ダイアログ連携の変更時に回帰リスクがあります。
- **対応方針**:
  - `useUserRecordPageModel` の対象を、表示列状態やフィルタ初期化の補助処理へ段階的に広げる。
  - ダイアログ開閉状態と保存フィルタ操作の置き場所を整理し、ページコンポーネントはリソース取得と描画接続に寄せる。
- **最終確認時点の状況 (2026年レビュー)**: 状況継続。pageModel の責務範囲はレコード処理に留まっており、フィルタ・列・ダイアログ状態の集約は UserRecord.tsx 内に残存。

### REF-F05: フィルタ永続化データの型検証不足
- **現状**:
  - `loadSavedFilters()` は `localStorage` から取り出した JSON を `JSON.parse` した結果のまま返しています。
  - `saveNewFilter()` / `deleteFilter()` にも `schemaVersion` や migration はありません。
- **影響**:
  - 不正 JSON は空配列になりますが、不正 shape の JSON は `SavedFilter[]` として後段へ流れる余地があります。
  - 将来的に `FilterState` を変更した際、保存済みデータとの互換性管理が難しくなります。
- **対応方針**:
  - `parseSavedFilters` を追加し、配列 shape と各 `SavedFilter` の最低限の型検証を行う。
  - `schemaVersion` を導入し、後方互換が必要になった時点で migration を追加できる構造にしておく。
- **最終確認時点の状況 (2026年レビュー)**: 状況継続。storage.ts に変更はなく、型検証・schemaVersion は未導入。テストも不正JSONケースのみ対応。

### REF-F07: 表示用定数/判定ロジックの整理不足
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
- **最終確認時点の状況 (2026年レビュー)**: 状況継続。DIFFICULTY_ORDER と DIFFICULTY_SHORT_NAME_MAP の分離が残存。filterDefaults.ts の TODO も未解消。

### REF-F08: TODO/FIXME の残置
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
- **最終確認時点の状況 (2026年レビュー)**: 状況継続。記載の全 TODO/FIXME が現存。プロジェクト全体で他に実質的なタスク系 TODO/FIXME は存在しない。

### REF-F09: UserOverPower ページロジックの責務集中
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
- **最終確認時点の状況 (2026年レビュー)**: 状況継続。グラフ生成系関数群は UserOverPower.tsx 内にローカル定義のまま（約580行ファイル）。usecases への抽出は buildOverPowerSummary のみ。

---

## 追加観点（2026年レビュー追記）

### REF-F10: DIFFICULTY_ORDER の重複定義と難易度定数一元化不足
- **現状**:
  - `DIFFICULTY_ORDER`（難易度ソート順）が `UserRecord/utils/sorting.ts` と `usecases/overpower/overpowerSummary.ts` の2箇所でほぼ同一内容で定義されています。
  - `difficultyUtils.ts` には短縮名・クエリ値・色系は集約されているが、ソート順序と一部短縮名定数（DIFFICULTY_SHORT_NAME_MAP）が散在。
- **影響**:
  - 難易度順序や表示ルールの変更時に、修正漏れや不整合のリスク。
  - F07 の方針「1モジュール統合」が部分的にしか進んでいない。
- **対応方針**:
  - `difficultyUtils.ts`（または新規 `src/constants/difficulty.ts`）に「表示名・短縮名・クエリ値・色・ソート順」を一元管理。
  - 既存2箇所の DIFFICULTY_ORDER を削除し、共通参照へ置き換え。
- **優先度**: Medium（F07 と合わせて早期対応推奨）

### REF-F11: SongManagementPage.tsx の責務集中
- **現状**:
  - 1627行とプロジェクト内で突出して大きい単一ファイル。
  - 楽曲/Worldsend 管理の CRUD、編集フォーム状態、API呼び出し、削除/復元ダイアログ、検索・フィルタなどが一箇所に集約。
- **影響**:
  - 管理機能とはいえ、変更時の影響範囲が広く、テスト追加・リファクタリングのハードルが高い。
  - REF-F04/F09 と同等かそれ以上の High リスク。
- **対応方針**:
  - ドメイン別（Song / Worldsend）に分割、または usecases 層へのロジック抽出を検討。
  - フォーム状態管理やダイアログを別コンポーネント/primitive へ切り出し。
- **優先度**: High（対象範囲拡大の最優先候補）

### REF-F12: テスト容易性の低いページ内補助関数群の増加傾向
- **現状**:
  - UserOverPower.tsx 内の `getScoreBand` / `getComboBand` / `buildGraphRows` 系など、ページローカルで定義され export されていない補助関数が多い。
  - 類似パターンが WorldsendRecord や他の大規模ページでも散見される可能性。
- **影響**:
  - 仕様変更時の退行検知が難しく、F09 の問題を拡大させる。
  - グラフ・集計ロジックのテストが usecases 層に十分移行していない。
- **対応方針**:
  - 集計・変換ロジックは原則 usecases または utils へ移動し、純粋関数としてテスト可能にする。
  - ページコンポーネントは「接続と描画」に徹する規律を徹底。
- **優先度**: Medium（F09 対応と合わせて）

---

## 推奨着手順（2026年レビュー追記で更新）

1. **保存データの型安全化**
   - `REF-F05` を進め、`localStorage` の破損耐性と将来の互換性を確保する。
2. **難易度定数の一元化と重複解消**
   - `REF-F10` + `REF-F07` を合わせて進め、DIFFICULTY_ORDER の重複と散在を解消。
3. **UserRecord のページモデル化**
   - `REF-F04` の残タスクとして、フィルタ初期化・表示列状態・ダイアログ状態をページ責務から分離する。
4. **UserOverPower の集計補助関数切り出し**
   - `REF-F09` として、グラフ行生成と分類ロジックをテスト可能な層へ移す（F12 も同時対応）。
5. **大規模管理画面の分割検討**
   - `REF-F11` として、SongManagementPage.tsx の責務集中を解消。
6. **定数整理と TODO/FIXME 整理**
   - `REF-F08` を後追いで整える。

---

## まとめ（2026年レビュー追記で更新）
- 現在の主戦場は `UserRecord` と `UserOverPower` 周辺です。
- `UserRecord` はソート・検索・表示列・保存データ・統計集計などのテストが増えており、ページモデル化はフィルタ初期化や表示列状態の整理が残っています。
- `UserOverPower` は usecase 層のテストはあるものの、ページ内に残るグラフ分類ロジックが大きく、次の分割候補です。
- （追記）難易度定数の重複（F10）、SongManagementPage の大規模化（F11）、テスト容易性の低い補助関数（F12）が新たに確認された優先課題です。
- 定数整理と TODO/FIXME 整理は低優先度ですが、ページ責務分割と合わせて進めると効率が良いです。
- ドキュメントの追跡性を高めるため、今後は各項目に「最終確認日」と「ステータス」を明記することを推奨します。

---

**参考**: 本レビューは 2026年時点のコードベース（UserRecord 約580行前後、SongManagementPage 1627行、TODO/FIXME 実質5件、DIFFICULTY_ORDER 重複確認済み）に基づきます。次回レビュー時は本ドキュメントの日付と状況を更新してください。

# フロントエンド リファクタリング観点整理 (2026-04-18 現在)

本ドキュメントは、`chunisupport-front` の現行実装を確認し、`_report/refactor.md` に以前記載していた改善点が現在も有効かを棚卸しした結果をまとめたものです。

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
- 共通定数/表示ルール: `src/utils/difficultyUtils.ts`, `src/utils/scoreRank.ts`

## 全体所見
1. `UserRecord` のページロジック、`localStorage` 永続化、テスト不足は引き続き未解消です。
2. 画面分割や純粋関数切り出しは進んでいますが、定数の散在と TODO/FIXME の残置はまだ改善余地があります。

---

## ステータス付きサマリ

| ID | タイトル | 重大度 | ステータス | 主な対象 |
|---|---|---|---|---|
| **REF-F04** | UserRecord ページロジックの責務集中 | **High** | **継続** | `src/pages/users/UserRecord/UserRecord.tsx` |
| **REF-F05** | フィルタ永続化データの型検証不足 | **Medium** | **継続** | `src/pages/users/UserRecord/utils/storage.ts` |
| **REF-F06** | レコード画面ロジックのテスト不足 | **Medium** | **一部改善** | `src/pages/users/UserRecord/utils/filtering.ts`, `src/pages/users/UserRecord/utils/recordStats.ts`, `src/pages/users/UserRecord/utils/storage.ts` |
| **REF-F07** | 表示用定数/判定ロジックの整理不足 | **Low** | **一部改善** | `src/utils/difficultyUtils.ts`, `src/utils/scoreRank.ts`, `src/pages/users/UserRecord/types/filterDefaults.ts`, `src/pages/users/UserRecord/utils/scoreRank.ts` |
| **REF-F08** | TODO/FIXME の残置 | **Low** | **継続** | `src/components/NavBar/NavBar.tsx`, `src/pages/users/UserPage/components/UserNameplate.tsx`, `src/pages/users/UserPage/components/UserRecordCard.tsx`, `src/pages/users/UserRecord/types/filterDefaults.ts` |

---

## 詳細

### REF-F04: UserRecord ページロジックの責務集中
- **ステータス**: 継続
- **現状**:
  - 旧レポート時点から `FilterDialog`、`FilterToolbar`、`FilterStats`、`RecordTable` などへ UI 分割は進んでいます (`src/pages/users/UserRecord/UserRecord.tsx:18-21`)。
  - `UserRecord.tsx` には依然としてデータ取得、フィルタ初期化、URL ソート読取、ソート計算、統計計算、ダイアログ状態、件数表示が集約されています (`src/pages/users/UserRecord/UserRecord.tsx:62-`)。
  - ソート用の `DIFFICULTY_ORDER` / `LAMP_ORDER` もページ内ローカル定義のままです (`src/pages/users/UserRecord/UserRecord.tsx:28-43`)。
- **影響**:
  - UI 分割済みでも、ページ仕様変更時の影響範囲が `UserRecord.tsx` に集中しています。
  - `createMemo` と `createSignal` の組み合わせが増えるほど、状態遷移の見通しが悪くなります。
- **対応方針**:
  - `useUserRecordPageModel` のようなページモデル層へ、取得済みデータから導出される状態を集約する。
  - ソート、件数、統計、初期フィルタ生成を純粋関数化して `UserRecord.tsx` から押し出す。

### REF-F05: フィルタ永続化データの型検証不足
- **ステータス**: 継続
- **現状**:
  - `loadSavedFilters()` は `localStorage` から取り出した JSON を `JSON.parse` した結果のまま返しています (`src/pages/users/UserRecord/utils/storage.ts:15-18`)。
  - `saveNewFilter()` / `deleteFilter()` にも `schemaVersion` や migration はありません (`src/pages/users/UserRecord/utils/storage.ts:25-37`)。
- **影響**:
  - 不正 JSON や旧フォーマットが混入しても、破損を明示せず空配列または不正 shape のまま後段へ流れる余地があります。
  - 将来的に `FilterState` を変更した際、保存済みデータとの互換性管理が難しくなります。
- **対応方針**:
  - `parseSavedFilters` を追加し、配列 shape と各 `SavedFilter` の最低限の型検証を行う。
  - `schemaVersion` を導入し、後方互換が必要になった時点で migration を追加できる構造にしておく。

### REF-F06: レコード画面ロジックのテスト不足
- **ステータス**: 一部改善
- **現状**:
  - `updatedAt.ts` に対応する `updatedAt.test.ts` が追加されました (`src/pages/users/UserRecord/utils/updatedAt.test.ts`)。
  - 一方で `filtering.ts`, `recordStats.ts`, `storage.ts` に対応する `*.test.ts` はいまだ存在しません。
  - `UserPage` 配下では `worldsendLampDisplay.test.ts`, `worldsendNavigation.test.ts`, `worldsendTableStyles.test.ts`, `scrollToTopVisibility.test.ts` など純粋関数テストの整備が進んでいます。
- **影響**:
  - フィルタ条件、統計集計、`localStorage` 復元の退行検知ができません。
  - リファクタ時に仕様固定の足場がなく、`UserRecord.tsx` の責務分割も進めにくいです。
- **対応方針**:
  - 優先順は `isRecordMatched`、`getRecordStats`、`loadSavedFilters`。
  - 先に純粋関数テストを置いてからページモデル化へ進むのが妥当です。

### REF-F07: 表示用定数/判定ロジックの整理不足
- **ステータス**: 一部改善
- **現状**:
  - スコアランク定義は `src/utils/scoreRank.ts` に寄せられ、`UserRecord` 側の `utils/scoreRank.ts` はその派生値を使う形になっています。
  - 一方で難易度の短縮名、クエリ値、バッジ色、カード境界色は `src/utils/difficultyUtils.ts` にまとまっているものの、`UserRecord.tsx` には別途 `DIFFICULTY_ORDER` が残っています (`src/pages/users/UserRecord/UserRecord.tsx:28-34`)。
  - ランプ選択肢は `src/pages/users/UserRecord/types/filterDefaults.ts` に残っており、サーバ由来データにすべきかを迷う TODO も残っています (`src/pages/users/UserRecord/types/filterDefaults.ts:6-11`)。
- **影響**:
  - 旧レポート時点よりは整理が進んだものの、「canonical な定義を 1 か所に寄せる」状態にはまだ至っていません。
  - 表示名、ソート順、初期選択肢、色の変更時に、修正箇所の探索コストが残ります。
- **対応方針**:
  - 難易度は「表示名・短縮名・クエリ値・色・順序」を 1 モジュールに統合する。
  - ランプも「表示用定義」と「フィルタ既定値」を分離し、選択肢そのものの出所を明確にする。

### REF-F08: TODO/FIXME の残置
- **ステータス**: 継続
- **現状**:
  - `NavBar` にレイアウト TODO が残っています (`src/components/NavBar/NavBar.tsx:179`)。
  - `UserNameplate` に未実装 TODO が 2 件残っています (`src/pages/users/UserPage/components/UserNameplate.tsx:25`, `src/pages/users/UserPage/components/UserNameplate.tsx:38`)。
  - `UserRecordCard` にデザイン判断の FIXME が残っています (`src/pages/users/UserPage/components/UserRecordCard.tsx:18`)。
  - `filterDefaults.ts` にも定数の出所や命名に関する TODO が残っています (`src/pages/users/UserRecord/types/filterDefaults.ts:6`, `src/pages/users/UserRecord/types/filterDefaults.ts:10`)。
- **影響**:
  - UI 演出、設計課題、データソース課題が同じ TODO として混在しており、優先順位が見えにくいです。
- **対応方針**:
  - `refactor` 対象と `design backlog` 対象を分けて整理する。
  - コメントとして残す場合は、未着手理由と次の判断条件を短く添える。

---

## 推奨着手順

1. **UserRecord のテスト追加**
   - `REF-F06` を先に進め、フィルタ・統計・保存データ読込の仕様を固定する。
2. **UserRecord のページモデル化**
   - `REF-F04` を進め、ページ責務を分割する。
3. **保存データの型安全化**
   - `REF-F05` を進め、`localStorage` の破損耐性と将来の互換性を確保する。
4. **取得戦略と定数整理**
   - `REF-F07`, `REF-F08` を後追いで整える。

## まとめ
- 現在の主戦場は `UserRecord` 周辺で、責務集中、保存データの型検証不足、テスト不足が残っています。
- `updatedAt.test.ts` の追加など、`UserRecord` 配下でテスト整備が始まっています。`filtering.ts` / `recordStats.ts` / `storage.ts` まで広げることが優先課題です。
- 定数整理と TODO/FIXME 整理は低優先度ですが、`UserRecord` の構造整理と合わせて進めると効率が良いです。

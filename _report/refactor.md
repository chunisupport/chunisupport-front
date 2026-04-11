# フロントエンド リファクタリング観点整理 (2026-04-12 現在)

本ドキュメントは、`chunisupport-front` の現行実装を確認し、`_report/refactor.md` に以前記載していた改善点が現在も有効かを棚卸しした結果をまとめたものです。
旧レポートのうち、現状と一致しない記述は削除または書き換えを行い、必要に応じてステータスを付け直しています。

## 優先度
- **Critical**: 誤認証・誤権限制御・誤遷移につながるもの
- **High**: 責務集中により変更時の不具合混入リスクが高いもの
- **Medium**: 改修コストや後方互換性コストを押し上げるもの
- **Low**: 定数整理、コメント整理、規律面の改善事項

## 対象範囲
- 認証/ガード: `src/components/guards`, `src/api/fetchWithAuth.ts`, `src/utils/postAuthRedirect.ts`, `src/usecases/auth/resolveAuthSession.ts`
- ユーザーページ: `src/pages/users/UserPage`
- レコード画面: `src/pages/users/UserRecord`
- 共通定数/表示ルール: `src/utils/difficultyUtils.ts`, `src/utils/scoreRank.ts`

## 全体所見
1. 旧レポートで最優先にしていた認証エラー処理の統一は、`resolveAuthSession` 導入によって大きく改善されています。
2. 一方で、`UserRecord` のページロジック、`localStorage` 永続化、テスト不足は引き続き未解消です。
3. 画面分割や純粋関数切り出しは進んでいますが、定数の散在と TODO/FIXME の残置はまだ改善余地があります。

---

## ステータス付きサマリ

| ID | タイトル | 重大度 | ステータス | 主な対象 |
|---|---|---|---|---|
| **REF-F02** | 権限制御と認証エラー処理の不統一 | ~~Critical~~ | **解消済み** | `src/components/guards/RequireRole.tsx`, `src/usecases/auth/resolveAuthSession.ts`, `src/utils/postAuthRedirect.ts` |
| **REF-F03** | UserPage のプロフィール二重取得 | **Medium** | **継続** | `src/pages/users/UserPage/UserPage.tsx` |
| **REF-F04** | UserRecord ページロジックの責務集中 | **High** | **継続** | `src/pages/users/UserRecord/UserRecord.tsx` |
| **REF-F05** | フィルタ永続化データの型検証不足 | **Medium** | **継続** | `src/pages/users/UserRecord/utils/storage.ts` |
| **REF-F06** | レコード画面ロジックのテスト不足 | **Medium** | **継続** | `src/pages/users/UserRecord/utils/filtering.ts`, `src/pages/users/UserRecord/utils/recordStats.ts`, `src/pages/users/UserRecord/utils/storage.ts` |
| **REF-F07** | 表示用定数/判定ロジックの整理不足 | **Low** | **一部改善** | `src/utils/difficultyUtils.ts`, `src/utils/scoreRank.ts`, `src/pages/users/UserRecord/types/filterDefaults.ts`, `src/pages/users/UserRecord/utils/scoreRank.ts` |
| **REF-F08** | TODO/FIXME の残置 | **Low** | **継続** | `src/components/NavBar/NavBar.tsx`, `src/pages/users/UserPage/components/UserNameplate.tsx`, `src/pages/users/UserPage/components/UserRecordCard.tsx`, `src/pages/users/UserRecord/types/filterDefaults.ts` |

---

## 詳細

### REF-F02: 権限制御と認証エラー処理の不統一
- **ステータス**: 解消済み
- **現状**:
  - `RequireRole` は `resolveAuthSession(() => fetchMe({ redirectOnUnauthorized: false }))` を使い、認証状態を `authenticated` / `unauthenticated` / `error` に分けて扱っています (`src/components/guards/RequireRole.tsx:17`, `src/components/guards/RequireRole.tsx:33`)。
  - `resolveAuthSession` は 401 系のみ `unauthenticated` として扱い、それ以外の一時的障害は `error` に分離しています (`src/usecases/auth/resolveAuthSession.ts:21-38`)。
  - `redirectAfterAuthentication` も `user_not_found` のときだけ `/register-score-temp` へ遷移し、それ以外は再 throw する実装に整理されています (`src/utils/postAuthRedirect.ts:11-20`)。
- **判断**:
  - 旧レポートにあった「`RequireRole` が例外をすべて `null` 扱いする」「`postAuthRedirect` がプロフィール取得失敗時に認証状態を消す」という記述は現状と一致しません。
  - `fetchWithAuth` 側の `redirectOnUnauthorized` 運用は依然として呼び出し側依存ですが、少なくとも認証ガード周辺の誤判定リスクは大きく下がっています。
- **メモ**:
  - 今後さらに詰めるなら、`fetchWithAuth` が投げるエラー型を専用型へ寄せて `status/code` 判定を共通化すると、`resolveAuthSession` 側の型安全性が上がります。

### REF-F03: UserPage のプロフィール二重取得
- **ステータス**: 継続
- **現状**:
  - `UserPage` は `rating` 用の `createResource` と `record` 用の `createResource` を別々に持っています (`src/pages/users/UserPage/UserPage.tsx:17-26`)。
  - `recordProfile` は `record` 系タブへ遷移したときだけ遅延取得されるため、旧レポート時点よりは無駄な取得が抑えられています (`src/pages/users/UserPage/UserPage.tsx:23`)。
- **影響**:
  - レコード画面表示時には、同一ユーザーに対して `rating` と `record` の2回取得が走る構造自体は残っています。
  - 成功/失敗状態が 2 本のリソースに分かれるため、将来のエラーハンドリングやローディング制御が複雑化しやすいです。
- **対応方針**:
  - `view=record` が `rating` 表示に必要な情報を包含できるなら取得を一本化する。
  - 一本化できない場合でも、ページ単位の取得戦略を `UserPage.tsx` から分離し、UI 側が 2 系統の取得状態を直接抱えない形に寄せる。

### REF-F04: UserRecord ページロジックの責務集中
- **ステータス**: 継続
- **現状**:
  - 旧レポート時点から `FilterDialog`、`FilterToolbar`、`FilterStats`、`RecordTable` などへ UI 分割は進んでいます (`src/pages/users/UserRecord/UserRecord.tsx:18-21`)。
  - ただし `UserRecord.tsx` には依然としてデータ取得、フィルタ初期化、URL ソート読取、ソート計算、統計計算、ダイアログ状態、件数表示が集約されています (`src/pages/users/UserRecord/UserRecord.tsx:57-243`)。
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
- **ステータス**: 継続
- **現状**:
  - `UserRecord` 配下には `filtering.ts`, `recordStats.ts`, `storage.ts` がありますが、対応する `*.test.ts` は存在しません。
  - 対照的に、認証や `UserPage` には純粋関数テストが複数追加されています (`src/usecases/auth/resolveAuthSession.test.ts`, `src/pages/users/UserPage/profilePageQuery.test.ts` など)。
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
  - `NavBar` にレイアウト TODO が残っています (`src/components/NavBar/NavBar.tsx:178`)。
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
   - `REF-F03`, `REF-F07`, `REF-F08` を後追いで整える。

## まとめ
- 旧レポートの最重要項目だった認証エラー処理の不統一は、現状では解消済みです。
- 現在の主戦場は `UserRecord` 周辺で、責務集中、保存データの型検証不足、テスト不足が残っています。
- 定数整理と TODO/FIXME 整理は低優先度ですが、`UserRecord` の構造整理と合わせて進めると効率が良いです。

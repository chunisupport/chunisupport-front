# フロントエンド リファクタリング観点整理 (Current Code Issues)

本ドキュメントは、`chunisupport-front` (SolidJS, Rsbuild, Tailwind CSS) の現行実装を対象に、保守性・挙動の一貫性・型安全性・テスト容易性の観点から整理したリファクタ候補をまとめたものです。
バックエンド向けの [`_report/_sample_refactor.md`](./_sample_refactor.md) の体裁を参考にしつつ、フロントエンド特有の論点に絞って記載しています。

## 優先度
- **Critical**: 誤画面遷移、権限制御の誤判定、ユーザー体験の大きな破綻につながるもの
- **High**: 状態管理や責務分離の欠如により、変更時の不具合混入リスクが高いもの
- **Medium**: 改修コストや仕様追加コストを押し上げる構造上の問題
- **Low**: 品質規律、命名、未解消TODOなどの改善事項

## 対象範囲
- ルーティング/認証ガード: `src/App.tsx`, `src/components/guards`, `src/hooks/useRedirectIfAuthenticated.ts`
- 認証状態管理: `src/stores/authSession.ts`, `src/utils/postAuthRedirect.ts`, `src/components/NavBar/NavBar.tsx`
- ユーザーページ/レコード画面: `src/pages/users/UserPage`, `src/pages/users/UserRecord`
- ユーティリティ/永続化: `src/utils`, `src/pages/users/UserRecord/utils`
- 型定義/エラーハンドリング: `src/types/api.ts`, `src/api/fetchWithAuth.ts`

## 全体所見
1. 認証状態の解決責務が `NavBar`、認証ガード、ログイン後遷移、未ログイン時リダイレクトに分散しており、`fetchMe` の多重実行と判定不整合が起きやすい構造です。
2. ユーザー画面とレコード画面で UI・取得・整形・集計・永続化が密結合しており、機能追加時の影響範囲が大きくなっています。
3. `localStorage` と URL パラメータに対する型検証が薄く、異常値が UI ロジックへ直接流れ込みます。
4. 純粋関数として切り出せているロジックは一部ありますが、重要なユースケースに対するテストが不足しています。

---

## 優先度順サマリ

| ID | タイトル | 重大度 | 主な対象 |
|---|---|---|---|
| **REF-F01** | 認証セッション解決の分散と多重フェッチ | **High** | `src/components/NavBar/NavBar.tsx`, `src/components/guards/RequireAuth.tsx`, `src/hooks/useRedirectIfAuthenticated.ts`, `src/utils/postAuthRedirect.ts`, `src/usecases/auth/resolveAuthSession.ts` |
| **REF-F02** | 権限制御と認証エラー処理の不統一 | **Critical** | `src/components/guards/RequireRole.tsx`, `src/api/fetchWithAuth.ts`, `src/utils/postAuthRedirect.ts` |
| **REF-F03** | UserPage のプロフィール二重取得 | **Medium** | `src/pages/users/UserPage/UserPage.tsx` |
| **REF-F04** | UserRecord コンポーネントの責務過多 | **High** | `src/pages/users/UserRecord/UserRecord.tsx` |
| **REF-F05** | フィルタ永続化データの型検証不足 | **Medium** | `src/pages/users/UserRecord/utils/storage.ts` |
| **REF-F06** | レコード画面ロジックのテスト不足 | **Medium** | `src/pages/users/UserRecord/utils/filtering.ts`, `src/pages/users/UserRecord/utils/storage.ts`, `src/pages/users/UserRecord/UserRecord.tsx` |
| **REF-F07** | 表示用定数/判定ロジックの分散 | **Low** | `src/utils/difficultyUtils.ts`, `src/utils/scoreRank.ts`, `src/pages/users/UserRecord/types/filterDefaults.ts`, `src/pages/users/UserRecord/utils/recordStats.ts` |
| **REF-F08** | TODO/FIXME の残置と暫定実装の常態化 | **Low** | `src/components/NavBar/NavBar.tsx`, `src/pages/users/UserPage/components/UserNameplate.tsx`, `src/pages/users/UserPage/components/UserRecordCard.tsx` |

---

## 詳細

### REF-F01: 認証セッション解決の分散と多重フェッチ
- **概要**:
  - 認証状態の解決が `NavBar` (`src/components/NavBar/NavBar.tsx:142`)、`RequireAuth` (`src/components/guards/RequireAuth.tsx:32`)、`useRedirectIfAuthenticated` (`src/hooks/useRedirectIfAuthenticated.ts:14`)、`redirectAfterAuthentication` (`src/utils/postAuthRedirect.ts:7`) に分散しています。
  - さらに `authSession` は単なるモジュール変数 (`src/stores/authSession.ts`) で、Solid のリアクティブストアとしては扱われていません。
- **影響**:
  - 初期表示や画面遷移で `fetchMe` が重複実行されやすいです。
  - 画面ごとに認証状態の同期タイミングが異なり、表示のちらつきや判定ズレの温床になります。
  - `NavBar` だけが `localStorage` の `navbar_username` を別管理しており、状態の正本が不明瞭です。
- **対応方針**:
  - 認証状態は `createStore` か `createResource` ベースの単一 `authSession` サービスへ集約する。
  - `fetchMe` を直接各コンポーネントで呼ばず、`ensureAuthSession()` のような共通入口に統一する。
  - `NavBar` の `localStorage` キャッシュは廃止し、必要ならセッションストア側で責務を持つ。

### REF-F02: 権限制御と認証エラー処理の不統一
- **概要**:
  - `RequireRole` は `fetchMe()` の例外をすべて `null` 扱いにしており (`src/components/guards/RequireRole.tsx:15`)、通信失敗・401・500 を区別していません。
  - `postAuthRedirect` はプロフィール取得失敗時に `user_not_found` 以外でも `clearAuthenticatedUser()` を実行します (`src/utils/postAuthRedirect.ts:20`)。
  - `fetchWithAuth` では 401 系をログイン画面へ飛ばしますが (`src/api/fetchWithAuth.ts:39`)、各呼び出し側で `redirectOnUnauthorized` の扱いが揺れています。
- **影響**:
  - 本来は「再試行可能な API エラー」であるケースが、`/403` への遷移や強制ログアウトとして処理される可能性があります。
  - 権限不足と未ログイン、通信障害が UI 上で同じ扱いになり、原因切り分けが困難です。
- **対応方針**:
  - `fetchMe` の失敗理由を `unauthorized` / `forbidden` / `unexpected` に分けて扱う。
  - `RequireRole` は認証済み前提の上で権限不足のみ `403` にし、それ以外はエラー画面または再試行導線へ分離する。
  - `postAuthRedirect` は `user_not_found` 以外で認証状態を消さず、画面エラーとして扱う。

### REF-F03: UserPage のプロフィール二重取得
- **概要**:
  - `UserPage` は `rating` 用 (`src/pages/users/UserPage/UserPage.tsx:17`) と `record` 用 (`src/pages/users/UserPage/UserPage.tsx:21`) の `createResource` を別々に持っています。
  - レコード画面表示時は同一ユーザーに対して `fetchUserProfile` を2回発行する構造です。
- **影響**:
  - 通信量と待ち時間が増えます。
  - 片方だけ失敗した場合の整合が複雑になります。
  - `UserProfileView` 側で「どちらが正本か」を意識した実装が必要になります。
- **対応方針**:
  - `view=record` が `rating` 表示に必要なデータを包含できるなら取得を一本化する。
  - 取得を分ける必要がある場合も、ページ種別から単一の query model を生成し、取得戦略をコンポーネント外へ出す。

### REF-F04: UserRecord コンポーネントの責務過多
- **概要**:
  - `UserRecord` はデータ取得 (`createResource`)、初期化 (`createEffect`)、フィルタ、ソート、追跡条件、統計計算、ダイアログ制御までを1ファイルで担っています (`src/pages/users/UserRecord/UserRecord.tsx`)。
  - `attachSongMetaToRecords`、`isRecordMatched`、`getRecordStats` などの純粋関数も活用していますが、最終的な画面ユースケースがコンポーネントに集約されすぎています。
- **影響**:
  - 仕様変更時の影響範囲が広く、レビューもしづらいです。
  - 表示とロジックが密結合なため、テストが書きにくいです。
  - `savedFilters` / `trackingCondition` / `sort` / `dialog open` の独立した状態遷移が絡み合っています。
- **対応方針**:
  - `useUserRecordPageModel` のようなページモデル層を作り、UI コンポーネントから集計・派生状態を切り離す。
  - 「フィルタ」「並び替え」「追跡条件」「統計計算」をそれぞれ独立モジュールに分割する。
  - `createMemo` 群の入出力を明示した純粋関数へ寄せ、コンポーネントはイベント配線に専念させる。

### REF-F05: フィルタ永続化データの型検証不足
- **概要**:
  - `loadSavedFilters()` と `loadTrackingCondition()` は `JSON.parse()` の結果をそのまま返しています (`src/pages/users/UserRecord/utils/storage.ts:24`, `src/pages/users/UserRecord/utils/storage.ts:51`)。
  - 期待 shape の検証やバージョン管理がありません。
- **影響**:
  - 旧フォーマットや手編集された不正 JSON が混入すると、UI ロジック側で静かに壊れます。
  - 今後フィールド追加を行う際に後方互換コストが跳ね上がります。
- **対応方針**:
  - `parseSavedFilters` / `parseTrackingCondition` を用意し、最低限の shape validation を入れる。
  - `schemaVersion` を持たせ、必要なら migration 関数で旧データを補正する。
  - 不正データは破棄するだけでなく、ログや復旧ポリシーを明示する。

### REF-F06: レコード画面ロジックのテスト不足
- **概要**:
  - `UserRecord` 配下には本体・ユーティリティ群が複数ありますが、同ディレクトリにはテストファイルが存在しません。
  - 一方で `src/usecases/auth` や `src/pages/users/UserPage` には純粋関数テストが用意されています。
- **影響**:
  - レコードフィルタ、追跡条件、統計計算の退行を検知できません。
  - バグ修正時に「仕様を固定するテスト」を残しづらい状態です。
- **対応方針**:
  - まず `isRecordMatched`, `getRecordStats`, `storage` の3点に単体テストを追加する。
  - 優先ケースは「未プレイ」「ランプ null」「スコア境界」「空配列」「不正 localStorage JSON」です。
  - `UserRecord` 本体は view model 化した後に統合テストへ寄せる。

### REF-F07: 表示用定数/判定ロジックの分散
- **概要**:
  - 難易度表示は `src/utils/difficultyUtils.ts`、スコアランクは `src/utils/scoreRank.ts`、フィルタ既定値は `src/pages/users/UserRecord/types/filterDefaults.ts`、集計カテゴリは `src/pages/users/UserRecord/utils/recordStats.ts` に分散しています。
  - それぞれが独立に定数を持っており、画面ごとの表現差異が生まれやすい構造です。
- **影響**:
  - 難易度追加やランク仕様変更時に修正漏れが起きやすいです。
  - UI 表示用語とビジネスルールが同期しづらくなります。
- **対応方針**:
  - 「難易度」「ランク」「ランプ」ごとに canonical な定義モジュールを作る。
  - 色、短縮名、URL クエリ値、ソート順などを同一ソースから派生させる。
  - 文字列リテラルを scattered に持たず、union type と定数オブジェクトを軸に揃える。

### REF-F08: TODO/FIXME の残置と暫定実装の常態化
- **概要**:
  - `src/components/NavBar/NavBar.tsx:50` に状態管理の TODO、`src/components/NavBar/NavBar.tsx:193` にレイアウト TODO、`src/pages/users/UserPage/components/UserNameplate.tsx:25`, `:38` に未実装 TODO、`src/pages/users/UserPage/components/UserRecordCard.tsx:18` に FIXME が残っています。
- **影響**:
  - 設計上の借りと見た目調整の借りが同列に放置され、優先度判断がしにくくなります。
  - 「暫定」が恒久化しやすく、次回改修時の判断材料も残りにくいです。
- **対応方針**:
  - 設計課題は `refactor`、見た目の改善は `design backlog` のように分類して Issue 化する。
  - コメントとして残す場合は「なぜ今やらないか」を短く補足する。

---

## 推奨着手順

1. **認証まわりの一本化**
   - `REF-F01`, `REF-F02` を最優先で解消し、`fetchMe` と遷移判定の入口を統一する。
2. **UserRecord のページモデル化**
   - `REF-F04` を進め、ロジックの責務を分割する。
3. **永続化とテストの基盤整備**
   - `REF-F05`, `REF-F06` を合わせて進め、localStorage の安全性と回帰検知を強化する。
4. **定数/表示ルールの整理**
   - `REF-F07`, `REF-F08` を後追いで整理し、規律を揃える。

## まとめ
- 最優先は **認証状態の単一化** と **権限制御/エラー制御の分離** です。
- 次点は **UserRecord の責務分割** で、ここを解消するとフィルタ・追跡条件・統計のテスト追加も進めやすくなります。
- 低優先度の TODO/FIXME も、設計課題と演出課題を分けて backlog 化しておくべきです。

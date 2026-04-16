# Firebase関連フロントエンド残課題整理

作成日: 2026-04-05
最終更新日: 2026-04-16

## 目的

2026-04-16 時点の Firebase 関連フロントエンド実装を基準に、今も残っている課題だけを整理する。

この文書では、既にコードで対応済みの事項は扱わない。  
次に着手すべき未解消項目と、API 契約待ちの項目だけを残す。

## 前提

- 内部 API 認証は Firebase ID トークン前提とする
- フロントは `fetchWithAuth` を通じて `Authorization: Bearer <Firebase ID Token>` を付与する
- 基準は現行 `API.md` と 2026-04-16 時点のコードベースとする

## 対象

- `API.md`
- `src/api/fetchWithAuth.ts`
- `src/api/register-data.ts`
- `src/api/settings.ts`
- `src/components/NavBar/NavBar.tsx`
- `src/pages/register-score-temp/RegisterScoreTempPage.tsx`
- `src/pages/settings/SettingsPage.tsx`
- `src/pages/settings/SettingsPrivacyPage.tsx`
- `src/pages/settings/SettingsApiTokenPage.tsx`
- `src/pages/settings/SettingsAccountDeletePage.tsx`

## 現在の実装前提

- Firebase Auth と Google ログイン導線は稼働している
- `fetchWithAuth` に Bearer トークン付与と 401 系の共通処理が集約されている
- 設定画面から次の機能に遷移できる
  - 非公開設定
  - APIトークン管理
  - 退会
- 退会は `DELETE /internal/me` と `X-Reauth-Token` を使って実装済みである
- ログアウトは `signOut(auth)` と `clearAuthenticatedUser()` で完結しており、旧 `/internal/auth/logout` 依存はない
- プレイヤーデータ登録導線は `/register-score-temp` と `POST /internal/me/register-data` / `POST /internal/player-data/commit` で提供されている

## 残課題

### 1. 設定トップが依然としてリンク集中心

`src/pages/settings/SettingsPage.tsx` は、現状でも各設定ページへのカードリンクを並べる構成が中心である。

退会導線は追加済みだが、設定トップ自体はまだ「アカウント管理画面」としては弱い。

不足している観点:

- 現在の認証状態やアカウント概要の表示
- プレイヤーデータ登録状況の表示
- 危険操作を含む導線の整理
- 将来の認証手段管理を追加しやすい構造

### 2. プレイヤーデータ削除 API のフロント導線がない

`API.md` には `DELETE /internal/me/player-data` が定義されているが、現時点のフロントにはこれを呼ぶ API クライアントも設定画面 UI も存在しない。

現在あるのはプレイヤーデータ登録導線のみで、設定画面から「連携解除」「関連データ削除」を完結できない。

必要な対応:

- `DELETE /internal/me/player-data` を呼ぶクライアント追加
- 削除影響を明示する確認 UI の追加
- `/register-score-temp` への再登録導線整理

### 3. 認証手段管理に必要な API 契約が未定義

次の機能は、現状ではフロント単独で実装を完結できない。

- 認証手段一覧 UI
- Firebase 連携解除 UI
- パスワード初回設定 UI

現時点で `API.md` に存在しない、またはフロントで利用可能な仕様が固まっていない候補:

- `GET /internal/me/auth-methods`
- `DELETE /internal/me/firebase/link`
- `POST /internal/me/password/setup`
- 最後の認証手段を削除できない場合のエラーコード

## 優先度つき対応方針

### 優先度 A: フロント単独で進められる項目

### A-1. 設定トップの再設計

対応内容:

- リンク集から、状態確認と導線整理を兼ねた設定トップへ変更する
- 少なくとも次の領域を置ける構成にする
  - アカウント概要
  - 非公開設定
  - API トークン
  - プレイヤーデータ
  - 退会

完了条件:

- 設定トップだけで主要な設定・危険操作の所在が把握できる
- 今後の認証手段管理追加に耐えられる

### A-2. プレイヤーデータ管理導線の追加

対応内容:

- `DELETE /internal/me/player-data` を設定画面から実行できるようにする
- プレイヤーデータ削除の影響範囲を説明する UI を用意する
- 再登録導線として `/register-score-temp` との関係を整理する

完了条件:

- 設定画面からプレイヤーデータの登録・解除の両方の導線が把握できる

### 優先度 B: API 契約待ちの項目

### B-1. 認証手段一覧

必要 API 候補:

- `GET /internal/me/auth-methods`

表示候補:

- Google 連携状態
- パスワード設定状態
- 利用可能な認証手段変更操作

### B-2. Firebase unlink

必要 API 候補:

- `DELETE /internal/me/firebase/link`

必要仕様:

- 最後の認証手段を外せない制約
- 制約時のエラーコード
- 再認証要否

### B-3. パスワード初回設定

必要 API 候補:

- `POST /internal/me/password/setup`

必要仕様:

- Firebase 専用ユーザーの判定方法
- 既存パスワードユーザーへの扱い

## 推奨画面構成

### 短期

- `/settings`
  - アカウント概要
  - 非公開設定
  - API トークン
  - プレイヤーデータ
  - 退会

### 中期

- `/settings`
  - 認証手段
  - プライバシー
  - API トークン
  - プレイヤーデータ
  - 退会
- 必要に応じた個別ページ
  - `/settings/privacy`
  - `/settings/api-token`
  - `/settings/password`

## テスト観点

### フロント単独対応で必須

- 設定トップ再設計後も既存の設定導線が壊れないこと
- プレイヤーデータ解除後に再登録導線が破綻しないこと
- プレイヤーデータ削除後に関連表示が正しく更新されること

### API 契約追加後に必須

- Google 連携済み / 未連携表示
- パスワード設定済み / 未設定表示
- Firebase unlink 不可理由の表示
- 認証手段変更時の再認証導線

## 受け入れ条件

- 文書上の前提が 2026-04-16 時点の `API.md` とコード実装に一致している
- 既に対応済みの項目が残課題として残っていない
- フロント単独で着手できる項目と API 契約待ち項目が分離されている
- 次に着手すべき対象が、設定トップ再設計とプレイヤーデータ管理導線追加であると読める

## まとめ

2026-04-16 時点で、Firebase 関連の基本導線、ログアウト整理、退会導線までは実装済みである。  
一方で、設定画面全体の情報設計と、プレイヤーデータ削除導線、認証手段管理 API の整備は未完了である。

直近の優先課題は次の 2 点である。

- 設定トップをアカウント管理画面として再設計する
- `DELETE /internal/me/player-data` を使ったプレイヤーデータ管理導線を追加する

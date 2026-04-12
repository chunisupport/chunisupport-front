# Firebase関連フロントエンド対応計画書

作成日: 2026-04-05
最終更新日: 2026-04-13

## 目的

2026-04-13 時点の Firebase 関連フロントエンド対応について、現在の実装、未実装項目、今後の実装順を整理する。

この文書は次の役割を持つ。

- 現在のフロント実装を固定する
- 現行 API 仕様を前提にフロントの課題を整理する
- 今すぐ着手できる項目と、API 契約待ちの項目を分ける
- 設定画面まわりの中期実装方針を共有する

## 前提

- 内部 API 認証は Firebase ID トークン前提とする
- フロントは `fetchWithAuth` を通じて `Authorization: Bearer <Firebase ID Token>` を付与する
- 計画の基準は `API.md` の現行仕様と現行コードベースとする

## 対象

- `API.md`
- `src/lib/firebase.ts`
- `src/api/fetchWithAuth.ts`
- `src/api/auth.ts`
- `src/api/settings.ts`
- `src/components/NavBar/NavBar.tsx`
- `src/pages/auth/Login/Login.tsx`
- `src/pages/auth/Register/Register.tsx`
- `src/pages/settings/SettingsPage.tsx`
- `src/pages/settings/SettingsPrivacyPage.tsx`
- `src/pages/settings/SettingsApiTokenPage.tsx`
- `src/types/api.ts`
- `src/stores/authSession.ts`
- `src/usecases/auth/resolveAuthSession.ts`
- `src/utils/postAuthRedirect.ts`

## 現在の実装

### 認証導線

- Google ポップアップによる Firebase ログインが実装済み
- Google ポップアップによる Firebase 新規登録導線が実装済み
- Firebase 認証後は `GET /internal/me` でアプリ内の認証済み状態を確定している
- `fetchWithAuth` は Firebase ID トークンを取得し、内部 API に Bearer トークンとして付与している

### 設定画面

- `/settings`
- `/settings/privacy`
- `/settings/api-token`

`SettingsPage.tsx` は現在リンク集であり、状態表示画面ではない。

### ログアウト

- `NavBar.tsx` ではログアウト時に Firebase SDK の `signOut(auth)` を実行している
- あわせて `clearAuthenticatedUser()` によりフロントの認証状態をクリアしている
- 現行の Bearer Token 前提では、ログアウトはフロントエンドで完結する

### エラーコード

- `src/types/api.ts` には `firebase_uid_already_linked` が定義済み
- `firebase_uid_already_linked` に対応する UI メッセージも定義済み

## 現在の API 状況

### フロントで利用中または利用可能な API

- `POST /internal/auth/signup`
- `POST /internal/auth/api-tokens`
- `DELETE /internal/auth/api-tokens`
- `GET /internal/me`
- `PUT /internal/me/privacy`
- `DELETE /internal/me`

### まだ API 契約が存在しない項目

- `GET /internal/me/auth-methods`
- `DELETE /internal/me/firebase/link`
- `POST /internal/me/firebase/unlink`
- `POST /internal/me/password/setup`
- `recent_login_required`
- `last_auth_method_cannot_be_removed`
- `password_already_configured`

## 現在の問題

### 1. 旧 logout API 依存が残っている

`src/api/auth.ts` には `POST /internal/auth/logout` を呼ぶ `postLogout()` がある。  
一方で、現行 `API.md` にこのエンドポイントは存在しない。

現行のログアウト自体は Firebase SDK 側の `signOut(auth)` とフロントの認証状態クリアで完結する。  
そのため、存在しない API 呼び出しは不要な旧依存として整理対象である。

### 2. 設定トップが Firebase 関連状態を持っていない

`SettingsPage.tsx` はリンク集であり、次の情報を表示できない。

- 認証まわりの現在状態
- 退会可能であること
- 今後追加される認証手段管理の配置先

### 3. 退会 API はあるが、フロント導線がない

`DELETE /internal/me` は API として存在するが、設定画面から実行できない。

### 4. 認証手段管理に必要な API 契約が未定義

次の機能は、現時点ではフロント単独で着手できない。

- 認証手段一覧 UI
- Firebase unlink UI
- パスワード初回設定 UI
- recent login を伴う危険操作 UI

## 実装方針

### 方針 1

短期では、現行 API とフロントだけで完結する範囲を先に整える。

対象:

- ログアウト処理の整理
- 設定トップ再設計
- 退会 UI

### 方針 2

認証手段管理系は、API 契約が定義されるまで土台だけ整える。

対象:

- 認証セクションの配置余地
- 状態表示用の view model 設計
- 追加エラーコードへの UI 文言変換方針

## 実装順

## フェーズ 1: ログアウト処理の整合

### ゴール

ログアウト処理をフロントエンド完結の実装として整理する。

### 対応内容

- `postLogout()` の利用継続可否を見直す
- `POST /internal/auth/logout` 依存を除去する
- ログアウトの正本を `signOut(auth)` とフロント状態クリアに寄せる

### 完了条件

- ログアウト処理がフロントエンドだけで完結している

## フェーズ 2: 設定トップ再設計

### ゴール

`SettingsPage.tsx` をアカウント管理の入口として拡張できる構造にする。

### 対応内容

- 既存のリンク集構成を見直す
- 次のブロックを置けるレイアウトにする
  - 認証
  - プライバシー
  - API トークン
  - プレイヤーデータ
  - 退会

### このフェーズでやらないこと

- 認証手段 API の実データ表示
- Firebase unlink
- password setup

### 完了条件

- 設定トップが今後の Firebase 関連機能を受け入れられる

## フェーズ 3: 退会 UI

### ゴール

`DELETE /internal/me` を設定画面から実行できるようにする。

### 追加対象

- `src/api/settings.ts`
- `src/pages/settings/SettingsPage.tsx`

### 実装内容

- 退会 API クライアントの追加
- 危険操作確認 UI の追加
- 成功後の `signOut(auth)` 実行
- 認証状態クリア
- `/login` または `/` への遷移

### 注意

現行 `API.md` では recent login を伴う再認証は未実装である。  
したがって現時点では、再認証付き退会ではなく、現行 API に合わせた退会 UI として実装する。

### 完了条件

- 設定画面から退会できる
- 退会後にフロント認証状態が残らない

## フェーズ 4: 認証手段管理の受け皿整備

### ゴール

将来の認証手段管理機能を設定トップへ自然に追加できる状態にする。

### 準備内容

- 認証セクションの配置余地を作る
- 表示用 state / view model の置き場を決める
- 将来追加されるエラーコードを UI メッセージへ変換する方針を整理する

### まだ前提にしないもの

- `GET /internal/me/auth-methods`
- Firebase unlink API
- password setup API
- recent login 必須仕様

### 完了条件

- API 契約追加後に無理なく実装へ進める

## 将来 API 追加後の実装候補

### 認証手段一覧

必要 API 候補:

- `GET /internal/me/auth-methods`

表示候補:

- Firebase 連携状態
- パスワード設定状態
- 実行可能な操作

### Firebase unlink

必要 API 候補:

- `DELETE /internal/me/firebase/link`

必要仕様:

- 最後の認証手段を外せない制約
- 制約時のエラーコード
- recent login 要否

### パスワード初回設定

必要 API 候補:

- `POST /internal/me/password/setup`

必要仕様:

- Firebase 専用ユーザーの判定方法
- 既存パスワードユーザーへの扱い

### recent login 必須の危険操作

必要仕様候補:

- `recent_login_required`
- 再認証後の Firebase ID トークン再取得フロー

## 推奨画面構成

### 短期構成

- `/settings`
  - アカウント
  - 非公開設定
  - API トークン
  - 退会

### 中期構成

- `/settings`
  - 認証手段
  - プライバシー
  - API トークン
  - プレイヤーデータ
  - 退会
- 必要に応じて詳細ページ
  - `/settings/privacy`
  - `/settings/api-token`
  - `/settings/password`

## テスト観点

### 現時点で必須

- ログアウト後に Firebase SDK と `authSession` がともに未認証になること
- 退会後にログイン画面またはトップへ遷移すること
- 退会後に保護ページへ再入場できないこと
- 設定トップ再設計後も既存リンクが壊れないこと

### API 契約追加後に必須

- Firebase 連携済み / 未連携表示
- パスワード設定済み / 未設定表示
- Firebase unlink 不可理由の表示
- recent login required の案内
- password setup と password change の分岐

## 受け入れ条件

- 文書上の前提が現行 API 仕様と一致している
- ログアウト処理がフロントエンド完結の実装として整理されている
- 設定トップがアカウント管理画面へ拡張できる構造になっている
- `DELETE /internal/me` を使った退会 UI がフロントで完結する
- 認証手段管理機能が API 契約待ちであることが明確になっている

## まとめ

現在の Firebase 関連フロントエンド対応で優先すべきなのは次の 4 点である。

- 旧 logout API 依存を除去する
- 設定トップをアカウント管理画面として再設計する
- `DELETE /internal/me` を使った退会導線を実装する
- 将来の認証手段管理機能を受け入れる土台を整える

認証手段一覧、Firebase unlink、password setup、recent login 必須フローは、API 契約が追加されてから着手する。

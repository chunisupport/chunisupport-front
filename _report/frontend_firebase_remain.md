# Firebase関連フロントエンド残課題整理

作成日: 2026-04-05
最終更新日: 2026-04-13

## 目的

2026-04-13 時点の Firebase 関連フロントエンド実装を現状ベースで整理し、完了済み事項と残課題を切り分ける。

この文書は次の用途を持つ。

- Firebase 認証まわりの現実装を固定する
- 既に完了した項目と、まだ残っている項目を分ける
- フロント単独で解消できる課題と、API 契約待ちの課題を分ける
- 設定画面の次の実装対象を明確にする

## 前提

- 内部 API 認証は Firebase ID トークン前提とする
- フロントは `fetchWithAuth` を通じて `Authorization: Bearer <Firebase ID Token>` を付与する
- 基準は現行 `API.md` と 2026-04-13 時点のコードベースとする

## 対象

- `API.md`
- `src/lib/firebase.ts`
- `src/api/fetchWithAuth.ts`
- `src/api/auth.ts`
- `src/api/settings.ts`
- `src/api/users.ts`
- `src/components/NavBar/NavBar.tsx`
- `src/pages/auth/Login/Login.tsx`
- `src/pages/auth/Register/Register.tsx`
- `src/pages/settings/SettingsPage.tsx`
- `src/pages/settings/SettingsPrivacyPage.tsx`
- `src/pages/settings/SettingsApiTokenPage.tsx`
- `src/stores/authSession.ts`
- `src/usecases/auth/resolveAuthSession.ts`
- `src/utils/postAuthRedirect.ts`

## 現在の実装

### 認証導線

- `src/lib/firebase.ts` で Firebase Auth と Google プロバイダを初期化している
- `/login` では Google ポップアップで Firebase ログインを行っている
- `/register` では Google 認証後にユーザー名を送信し、`POST /internal/auth/signup` でアカウント作成している
- Firebase 認証後は `redirectAfterAuthentication()` 内で `GET /internal/me` を実行し、フロントの認証済み状態を確定している
- `resolveAuthSession()` により `GET /internal/me` の重複実行を抑えつつ、`authSession` を解決している

### 認証付き API 呼び出し

- `fetchWithAuth` は Firebase ID トークンを取得して Bearer トークンを付与する
- 401 または認証系エラーコード時は `clearAuthenticatedUser()` を実行し、必要に応じて `/login` へリダイレクトする
- `redirectOnUnauthorized: false` を使うことで、セッション確認系処理では自動遷移を抑止できる

### 設定画面

- `/settings` は存在するが、現状は設定ページへのリンク集である
- `/settings/privacy` では `GET /internal/me` と `PUT /internal/me/privacy` を使って非公開設定を変更できる
- `/settings/api-token` では `POST /internal/auth/api-tokens` と `DELETE /internal/auth/api-tokens` を使って API トークンを管理できる
- 設定トップからは現在次の 2 画面に遷移できる
  - 非公開設定
  - APIトークン管理

### ログアウト

- `NavBar.tsx` のログアウト操作では `postLogout()` を呼び、その後 `signOut(auth)` と `clearAuthenticatedUser()` を実行している
- ただし `postLogout()` は `POST /internal/auth/logout` を呼んでおり、現行 `API.md` にはこのエンドポイントが存在しない
- 実際のセッション破棄は Firebase SDK 側の `signOut(auth)` とフロント状態クリアで成立している

### エラーコード

- `src/types/api.ts` に `firebase_uid_already_linked` が定義されている
- 同コードに対する UI 表示文言も実装済みである

## API 契約の現状

### フロントで利用中の API

- `POST /internal/auth/signup`
- `POST /internal/auth/api-tokens`
- `DELETE /internal/auth/api-tokens`
- `GET /internal/me`
- `PUT /internal/me/privacy`

### API.md には存在するが、Firebase 関連画面では未利用の API

- `DELETE /internal/me`
- `DELETE /internal/me/player-data`
- `POST /internal/me/register-data`

### まだ API 契約が存在しない項目

- `GET /internal/me/auth-methods`
- `DELETE /internal/me/firebase/link`
- `POST /internal/me/password/setup`
- `recent_login_required`
- `last_auth_method_cannot_be_removed`
- `password_already_configured`

## 完了済み事項

### 1. Firebase ログインと新規登録導線

- Google ログイン導線は稼働している
- Google 認証を起点にした新規登録導線も稼働している
- 登録後とログイン後のリダイレクト導線も実装済みである

### 2. Bearer トークン前提の内部 API 呼び出し

- `fetchWithAuth` に Bearer トークン付与が集約されている
- 未認証時のフロント状態クリアとログイン画面遷移も共通化されている

### 3. 設定配下の個別機能

- 非公開設定変更は画面・API クライアントともに実装済みである
- API トークンの発行・削除も画面・API クライアントともに実装済みである

## 残課題

### 1. 旧 logout API 依存が残っている

`src/api/auth.ts` には `POST /internal/auth/logout` を呼ぶ `postLogout()` が残っている。  
`NavBar.tsx` もこの API 呼び出しを前提にしている。

しかし、2026-04-13 時点の `API.md` にはこのエンドポイントが存在しない。  
現行仕様では、ログアウトは `signOut(auth)` と `clearAuthenticatedUser()` で完結させるべきである。

### 2. 設定トップがリンク集のまま

`SettingsPage.tsx` は現在も 2 件のリンクを並べるだけの構成であり、アカウント管理の入口としては情報量が不足している。

不足している要素:

- 認証状態の概要
- 危険操作の導線
- プレイヤーデータ管理への導線
- 将来の認証手段管理を置くスペース

### 3. 退会 API は存在するが、フロント導線がない

`API.md` には `DELETE /internal/me` が定義されているが、フロントから呼ぶ API クライアントも設定画面 UI も存在しない。

そのため、アカウント削除はバックエンド仕様上は可能でも、ユーザー操作としては未提供である。

### 4. プレイヤーデータ解除 API はあるが、設定導線がない

`API.md` には `DELETE /internal/me/player-data` がある一方で、設定画面にはプレイヤーデータ連携解除の導線がない。

`/register-score-temp` は登録処理の導線として存在するが、設定画面からデータ管理を完結できる構造にはなっていない。

### 5. 認証手段管理に必要な API 契約が未定義

次の機能は現時点ではフロント単独で完結できない。

- 認証手段一覧 UI
- Firebase unlink UI
- パスワード初回設定 UI
- recent login を伴う危険操作 UI

## 優先度つき対応方針

### 優先度 A: フロント単独で解消できる項目

### A-1. ログアウト処理の整理

対応内容:

- `postLogout()` の利用を廃止する
- `POST /internal/auth/logout` 依存を削除する
- ログアウトの正本を `signOut(auth)` と `clearAuthenticatedUser()` に寄せる

完了条件:

- ログアウト処理が現行 API 仕様に依存せず動作する
- ログアウト後に Firebase と `authSession` の両方が未認証になる

### A-2. 設定トップの再設計

対応内容:

- リンク集から、アカウント管理の入口として意味のあるトップへ変更する
- 少なくとも次のブロックを配置できる構成にする
  - アカウント
  - 非公開設定
  - API トークン
  - プレイヤーデータ
  - 退会

完了条件:

- 設定トップが今後の機能追加に耐えられる構造になる

### A-3. 退会 UI の実装

対応対象:

- `src/api/settings.ts` または適切な API モジュール
- `src/pages/settings/SettingsPage.tsx`

対応内容:

- `DELETE /internal/me` を呼ぶクライアントを追加する
- 危険操作確認 UI を追加する
- 成功後に `signOut(auth)` と `clearAuthenticatedUser()` を実行する
- ログイン画面またはトップへ遷移させる

注意:

2026-04-13 時点の `API.md` には recent login 前提の再認証仕様はない。  
したがって当面は、現行 API に合わせたシンプルな退会導線として実装する。

完了条件:

- 設定画面から退会できる
- 退会後に保護ページへ再入場できない

### A-4. プレイヤーデータ管理導線の追加

対応内容:

- `DELETE /internal/me/player-data` を設定画面から実行できるようにする
- プレイヤーデータ削除の影響範囲を説明する UI を用意する
- 再登録導線として `/register-score-temp` との関係を整理する

完了条件:

- プレイヤーデータ連携の追加と解除の導線が設定画面側で把握できる

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
- recent login 要否

### B-3. パスワード初回設定

必要 API 候補:

- `POST /internal/me/password/setup`

必要仕様:

- Firebase 専用ユーザーの判定方法
- 既存パスワードユーザーへの扱い

### B-4. recent login 必須の危険操作

必要仕様候補:

- `recent_login_required`
- 再認証後の Firebase ID トークン再取得フロー

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

- ログアウト後に Firebase SDK と `authSession` がともに未認証になること
- ログアウト後に `POST /internal/auth/logout` 不要でも正常動作すること
- 退会後にログイン画面またはトップへ遷移すること
- 退会後に保護ページへ再入場できないこと
- 設定トップ再設計後も既存の設定導線が壊れないこと
- プレイヤーデータ解除後に再登録導線が破綻しないこと

### API 契約追加後に必須

- Google 連携済み / 未連携表示
- パスワード設定済み / 未設定表示
- Firebase unlink 不可理由の表示
- recent login required の案内
- password setup と password change の分岐

## 受け入れ条件

- 文書上の前提が 2026-04-13 時点の `API.md` とコード実装に一致している
- 完了済み事項と残課題が明確に分かれている
- フロント単独で着手できる項目と API 契約待ち項目が分離されている
- 次に着手すべき対象が `logout` 整理、設定トップ再設計、退会、プレイヤーデータ管理導線であると読める

## まとめ

2026-04-13 時点で Firebase 関連の基礎導線は概ね実装済みである。

実装済み:

- Google ログイン
- Google 認証を使った新規登録
- Bearer トークン付き内部 API 呼び出し
- 非公開設定
- API トークン管理

残っている主な課題:

- 旧 logout API 依存の除去
- 設定トップの再設計
- 退会導線の追加
- プレイヤーデータ管理導線の追加
- 認証手段管理 API 契約の整備待ち

特にフロント単独で進められるのは、`POST /internal/auth/logout` 依存の解消と、設定画面をアカウント管理の入口として成立させる作業である。

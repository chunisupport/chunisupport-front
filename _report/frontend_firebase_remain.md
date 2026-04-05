# Firebase関連フロントエンド対応計画書

作成日: 2026-04-05

## 目的

Firebase 関連のフロントエンド対応を、単発の画面追加ではなく、認証手段管理・退会・再認証・初回パスワード設定まで含めた一連の計画として整理する。

この文書は次の役割を持つ。

- 現状のフロント実装を固定する
- バックエンド依存の前提を明文化する
- 画面・API クライアント・状態管理の実装順を整理する
- 途中で UI が破綻しないための設計指針を残す

## 参照

- `../../chunisupport-api/_report/firebase_auth_migration_next_steps_20260405.md`
- `API.md`
- `src/api/auth.ts`
- `src/api/settings.ts`
- `src/lib/firebase.ts`
- `src/pages/auth/Login/Login.tsx`
- `src/pages/auth/Register/Register.tsx`
- `src/pages/settings/SettingsPage.tsx`
- `src/pages/settings/SettingsGoogleLinkPage.tsx`
- `src/pages/settings/SettingsPasswordPage.tsx`
- `src/pages/settings/SettingsRecoveryCodesPage.tsx`
- `src/components/NavBar/NavBar.tsx`
- `src/types/api.ts`
- `src/api/fetchWithAuth.ts`
- `src/stores/authSession.ts`
- `src/usecases/auth/resolveAuthSession.ts`

## 現状の確定事項

### 実装済み導線

- Google アカウントでの Firebase ログイン
- Google アカウントでの Firebase 新規登録
- ログイン済みユーザーへの Firebase 連携

### 現状 UI の性格

- Firebase を使うアカウント管理画面ではなく、Google 連携画面が単体である状態
- 設定トップは状態表示画面ではなくリンク集
- 退会、再認証、認証手段管理、初回パスワード設定は未実装

### コード確認で確定した補足

- `SettingsPage.tsx` は状態を持たず、各設定ページへのリンク一覧のみ
- `SettingsGoogleLinkPage.tsx` は Google ポップアップで `id_token` を取り、`POST /internal/me/firebase/link` を呼ぶだけ
- unlink UI は存在しない
- `SettingsPasswordPage.tsx` は `current_password` 必須
- `NavBar.tsx` のログアウトは `POST /internal/auth/logout` のみで、Firebase SDK 側の sign out はしていない
- `src/types/api.ts` に `firebase_uid_already_linked` が未定義

## この計画の前提

### 前提 1

当面はバックエンド側の認証構成を維持する。

- 入口は Firebase
- 継続利用は独自セッション + Cookie

したがって、フロントでもこのフェーズでは `fetchWithAuth` と Cookie 前提を崩さない。

### 前提 2

このフェーズの unlink は「アプリ内の Firebase UID 連携解除」を意味する。

注意:

- Firebase Auth provider unlink とは別概念
- UI 文言でも混同しないようにする

### 前提 3

フロントはバックエンドが返す「認証手段状態」を正本として扱う。

現状のフロントは Firebase SDK の状態とアプリセッション状態を混同しやすい。  
認証手段の表示可否は、必ず API レスポンスに基づいて決定する。

## バックエンドに先に必要なもの

フロント側は次が定義されないと安全に着手できない。

### 必須 API

- `GET /internal/me/auth-methods`
- `DELETE /internal/me/firebase/link` または `POST /internal/me/firebase/unlink`
- `POST /internal/me/password/setup`
- 再認証付き `DELETE /internal/me`

### 必須仕様

- 退会後に同じ Firebase UID で再登録できるか
- 認証手段種別をどう定義するか
- 最後の認証手段を外せない制約をどう返すか
- 退会や unlink に再認証を要求するか
- password setup の適用対象

## フロントエンドで解決すべき問題

### 1. 認証手段の状態表示ができない

今の UI では次が見えない。

- Firebase 連携済みか
- パスワード設定済みか
- どの操作が可能か
- 最後の認証手段を外せないか

### 2. 退会導線が存在しない

今のフロントは退会 API 呼び出し自体を持たない。  
そのため、バックエンドが再認証付き退会に変わっても受け皿がない。

### 3. Firebase 専用ユーザー向け導線がない

今のパスワード変更画面は「既にパスワードがあるユーザー」向けであり、Firebase 専用ユーザーの初回設定導線ではない。

### 4. アプリ状態と Firebase 状態が同期されていない

ログアウトや退会後に、アプリの Cookie セッション状態と Firebase SDK 状態が食い違う余地がある。

## 目標 UI

この計画の完了時、少なくとも次が実現されている状態を目指す。

- 設定トップで認証手段が一覧できる
- Firebase 連携状態が見える
- パスワード設定状態が見える
- 状態に応じて CTA が切り替わる
- 退会時は再認証 UI を経由する
- Firebase 専用ユーザーは初回パスワード設定ができる
- ログアウト / 退会時のクライアント状態整理方針が統一されている

## 画面・API・状態モデルの計画

## フェーズ 1: 状態表示前提の設計に切り替える

### ゴール

設定ページを「リンク集」ではなく、将来的に認証手段情報を載せるページとして再設計できるようにする。

### 対応内容

- `SettingsPage.tsx` のレイアウトを状態表示前提に見直す
- 設定項目をカード一覧から状態表示ブロック中心へ移行できる構造にする
- 認証手段、セッション、リカバリーコード、API トークン、退会を同一ページに集約する前提で整理する

### このフェーズでまだやらないこと

- 本番の認証手段表示ロジック
- 実際の退会実行
- unlink 実行

### 完了条件

- `SettingsPage.tsx` が将来の状態表示ブロックを受けられる構造になる
- 画面分散が増えても破綻しない配置方針が決まっている

## フェーズ 2: 認証手段一覧 UI を入れる

### ゴール

`GET /internal/me/auth-methods` を使い、現在の認証手段状態と許可操作を表示できるようにする。

### 追加対象

- `src/types/api.ts`
- `src/api/settings.ts`
- `src/pages/settings/SettingsPage.tsx`

### 追加したい型の例

```ts
export interface AuthMethodsResponse {
  primary_mode: 'firebase_only' | 'password_only' | 'hybrid'
  firebase: {
    linked: boolean
    provider?: 'google'
  }
  password: {
    configured: boolean
  }
  actions: {
    can_unlink_firebase: boolean
    can_setup_password: boolean
    requires_reauth_for_unlink: boolean
  }
}
```

### UI で最低限表示するもの

- Firebase 連携済み / 未連携
- パスワード設定済み / 未設定
- 現在の認証手段種別
- 実行可能な操作

### CTA の出し分け

- Firebase を連携する
- Firebase を解除する
- パスワードを設定する
- パスワードを変更する

### 完了条件

- ユーザーは設定トップを見れば、自分の認証状態を把握できる
- 「何ができるか」がページ遷移前に分かる

## フェーズ 3: Firebase unlink 導線

### ゴール

連携済みアカウントを安全に解除できる導線を追加する。

### 追加対象

- `src/api/settings.ts`
- `src/pages/settings/SettingsPage.tsx`
- 必要なら `src/pages/settings/SettingsGoogleLinkPage.tsx`

### 実装内容

- unlink API クライアント
- 解除確認ダイアログ
- 実行後の状態再取得
- 最後の認証手段を外せない場合の文言表示
- 必要なら再認証 UI 呼び出し

### UI 方針

この機能は長期的には `SettingsGoogleLinkPage.tsx` に閉じず、認証手段管理ブロックへ統合する方がよい。

### 完了条件

- 連携済みユーザーが解除操作を行える
- 不可条件では理由が明示される

## フェーズ 4: 退会 + 再認証フロー

### ゴール

退会を、Firebase 再認証前提の安全なフローとして実装する。

### 追加対象

- `src/api/settings.ts`
- `src/pages/settings/SettingsPage.tsx`
- `src/App.tsx`
- 必要なら専用退会ページ

### 必須 UI

- 退会ボタン
- 危険操作の確認文言
- 再認証開始ボタン
- 退会後の説明

### 必須処理

- Google ポップアップで最新の ID トークンを取得
- 退会 API に `id_token` を渡す
- 成功後に認証セッションストアをクリアする
- 必要なら Firebase SDK を sign out する
- ログイン画面またはトップへ遷移する

### 文言で必ず明示したいこと

- 退会後に同じ Firebase アカウントで再登録できるか
- 何が削除されるか
- 何が残るか

### 完了条件

- 退会は UI 上で完結する
- 再認証を経ない退会実行手段が残らない

## フェーズ 5: Firebase 専用ユーザー向けパスワード初回設定

### ゴール

Firebase のみで登録したユーザーが、現在パスワード未設定でも追加できるようにする。

### 追加対象

- `src/api/settings.ts`
- `src/pages/settings/SettingsPasswordPage.tsx`
- `src/pages/settings/SettingsPage.tsx`

### 実装内容

- `change password` と `setup password` の分岐
- 現在状態に応じた表示切替
- 説明文の追加

### 説明すべき内容

- 現在のパスワードは未設定であること
- リカバリーコードとの関係
- パスワード追加後に使えるログイン方法

### 完了条件

- Firebase 専用ユーザーでも自然にパスワード追加できる
- 既存のパスワード変更導線と混線しない

## フェーズ 6: エラーコードと文言の整備

### ゴール

Firebase 関連エラーが UI 上で意味のある文言として扱える状態にする。

### 追加対象

- `src/types/api.ts`
- `src/api/auth.ts`
- `src/api/settings.ts`

### 最低限追加したいコード

- `firebase_uid_already_linked`
- `recent_login_required`
- `last_auth_method_cannot_be_removed`
- `password_already_configured`

### 完了条件

- Firebase 関連 API の失敗時に「失敗しました」だけで終わらない
- ユーザーが次の操作を判断できる文言になる

## フェーズ 7: ログアウト時の Firebase 状態同期

### ゴール

アプリセッションと Firebase SDK の状態を破綻させない。

### 追加対象

- `src/components/NavBar/NavBar.tsx`
- `src/lib/firebase.ts`
- 必要なら認証ストア周辺

### 決めること

- ログアウト時に Firebase SDK も sign out するか
- 退会時は必ず sign out するか
- セッション切れ時に Firebase 側が残っていた場合の扱い

### 推奨

- 通常ログアウトはアプリセッション失効 + Firebase sign out を基本線にする
- 退会時は必ず Firebase sign out する

理由:

- 再認証フローと通常ログインフローの状態不整合を減らしやすい

### 完了条件

- ログアウト後に「アプリはログアウト済みだが Firebase SDK はログイン中」という中途半端な状態を減らせる

## 画面構成の推奨

### 推奨構成

- `/settings`
  - 認証手段
  - セッション
  - リカバリーコード
  - API トークン
  - 退会
- `/settings/password`
  - 詳細なパスワード変更または初回設定

### 将来的に縮小したいページ

- `/settings/google-link`

理由:

- 認証手段管理を専用ページに分断すると、状態表示と操作が別れて分かりにくい

## 実装順

1. バックエンドの仕様確定内容を受けて、`AuthMethodsResponse` などの型を定義する
2. `SettingsPage.tsx` を状態表示前提の構造へ寄せる
3. auth-methods API クライアントと認証手段表示を入れる
4. Firebase unlink 導線を追加する
5. 退会 + 再認証フローを追加する
6. Firebase 専用ユーザー向け password setup 導線を追加する
7. エラーコードと文言を整備する
8. ログアウト時の Firebase 状態同期を整理する

## テスト観点

### UI テストで必須

- Firebase 連携済み / 未連携の表示
- パスワード設定済み / 未設定の表示
- 最後の認証手段解除不可メッセージ
- 退会確認ダイアログ
- 再認証成功 / 失敗時の表示
- password setup と password change の分岐

### 手動確認で必須

- Google ログイン済みユーザーの unlink
- Firebase 専用ユーザーの password setup
- hybrid ユーザーの退会
- ログアウト後の再訪時の状態

## 受け入れ条件

この計画が完了したと判断できる条件は次。

- 設定トップで認証手段の現在状態が分かる
- 退会は再認証付きで実行できる
- Firebase unlink が状態制約付きで実行できる
- Firebase 専用ユーザーが初回パスワード設定できる
- エラー文言が最低限意味を持つ
- ログアウト時の Firebase 状態同期方針がコードに反映されている

## まとめ

現在の実装は「Firebase で入れる・登録できる・連携できる」段階で止まっている。  
不足しているのは次の 5 本である。

- 認証手段管理 UI
- Firebase unlink 導線
- 退会 + 再認証フロー
- Firebase 専用ユーザー向け初回パスワード設定
- Firebase とアプリセッションの状態整合

この計画では、まずバックエンドの API 契約を受け、設定トップを状態表示画面に変え、その上で unlink、退会、password setup を順に積む。  
この順番で進めるのが、今のコードベースでは最も安全で戻りが少ない。

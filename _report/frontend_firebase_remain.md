# Firebase関連フロントエンド残課題整理

作成日: 2026-04-05
最終更新日: 2026-04-20

## 目的

2026-04-20 時点の Firebase 関連フロントエンド実装を基準に、今も残っている課題だけを整理する。

この文書では、既にコードで対応済みの事項は扱わない。  
次に着手すべき未解消項目と、API 契約待ちの項目だけを残す。

## 前提

- 内部 API 認証は Firebase ID トークン前提とする
- フロントは `fetchWithAuth` を通じて `Authorization: Bearer <Firebase ID Token>` を付与する
- 現在のルーティング上、設定画面は `/settings/:section?`（`Settings`）を使用している

## 対象

- `src/api/fetchWithAuth.ts`
- `src/api/settings.ts`
- `src/components/NavBar/NavBar.tsx`
- `src/pages/register-score-temp/RegisterScoreTempPage.tsx`
- `src/pages/settings/Settings.tsx`
- `src/App.tsx`

## 現在の実装前提（2026-04-20）

- Firebase Auth と Google ログイン導線は稼働している
- `fetchWithAuth` に Bearer トークン付与と 401 系の共通処理が集約されている
- 設定トップ（`/settings`）はリンク集ではなく、次を 1 画面で扱う構成になっている
  - アカウント概要表示
  - 非公開設定の更新
  - API トークン発行/削除
  - プレイヤーデータ状態表示・削除
  - 退会
- プレイヤーデータ削除（`DELETE /internal/me/player-data`）導線は実装済み
- 退会は `DELETE /internal/me` と `X-Reauth-Token` を使って実装済み
- ログアウトは Firebase `signOut` と `clearAuthenticatedUser()` で完結している

## 残課題

### 1. 認証手段管理に必要な API 契約が未定義

次の機能は、現状ではフロント単独で実装を完結できない。

- 認証手段一覧 UI
- Firebase 連携解除 UI
- パスワード初回設定 UI

現時点でフロント実装からは利用可能な仕様が固まっていない候補:

- `GET /internal/me/auth-methods`
- `DELETE /internal/me/firebase/link`
- `POST /internal/me/password/setup`
- 最後の認証手段を削除できない場合のエラーコード

### 2. 設定画面のテスト不足

設定画面で Firebase 関連の重要操作（非公開設定更新 / API トークン更新 / プレイヤーデータ削除 / 退会）が 1 画面に集約された一方、`settings` 配下の自動テストが未整備である。

必要な対応:

- `src/pages/settings/Settings.tsx` の操作フローに対するユースケース/コンポーネントテスト追加
- 少なくとも以下の退行を検知できるようにする
  - 401 系エラー時のエラー表示
  - API トークン発行/削除後の状態更新
  - プレイヤーデータ削除後の再取得・表示更新
  - 退会成功時のサインアウトと遷移

## 優先度つき対応方針

### 優先度 A: フロント単独で進められる項目

#### A-1. 設定画面テストの整備

完了条件:

- Firebase 関連の主要操作で回帰が検知できるテストが追加されている

### 優先度 B: API 契約待ちの項目

#### B-1. 認証手段一覧

必要 API 候補:

- `GET /internal/me/auth-methods`

#### B-2. Firebase unlink

必要 API 候補:

- `DELETE /internal/me/firebase/link`

必要仕様:

- 最後の認証手段を外せない制約
- 制約時のエラーコード
- 再認証要否

#### B-3. パスワード初回設定

必要 API 候補:

- `POST /internal/me/password/setup`

必要仕様:

- Firebase 専用ユーザーの判定方法
- 既存パスワードユーザーへの扱い

## テスト観点

### フロント単独対応で必須

- 設定画面上の各操作で成功/失敗メッセージが適切に表示されること
- プレイヤーデータ削除後に表示が再取得結果へ反映されること
- 退会時に再認証エラーが適切に表示されること

### API 契約追加後に必須

- Google 連携済み / 未連携表示
- パスワード設定済み / 未設定表示
- Firebase unlink 不可理由の表示
- 認証手段変更時の再認証導線

## 受け入れ条件

- 文書上の前提が 2026-04-20 時点の実装に一致している
- 既に対応済みの項目（設定トップ再設計、プレイヤーデータ削除導線）が残課題として残っていない
- フロント単独で着手できる項目と API 契約待ち項目が分離されている

## まとめ

2026-04-20 時点で、Firebase 関連の基本導線（認証、ログアウト、退会、API トークン、プレイヤーデータ削除）は実装済みである。  
残る主要課題は、認証手段管理の API 契約確定、設定画面テスト整備である。

# ログイン方法（Google・X）

## 概要

- 通常のログイン（`/login`）、新規登録（`/register`）、スタッフ向けのメンテナンス中ログインでは、Google と X のどちらでもログインできる。
- Firebase Authentication のポップアップ認証（`signInWithPopup`）を使い、Turnstile と既存の `/internal/auth/login`・`/internal/auth/signup` で検証する。API は Firebase の ID トークンだけを検証するため、認証プロバイダごとの API の違いはない。
- 認証プロバイダの一覧と表示順は `src/constants/authProviders.ts` で管理する。X は Firebase 上では `twitter.com` として扱われる。
- ログイン画面では Turnstile を1回確認すれば、どちらのボタンでもログインできる。

## 新規登録

- Google または X で認証し、未登録であればユーザー名の入力へ進む。登録済みのアカウントで認証した場合はサインアウトし、ログイン画面へ案内する。
- 認証済みのアカウントは、Google はメールアドレス、X は表示名で表示する。

## ログイン方法の連携・解除

- 設定の「アカウント」にある「ログイン方法」から、ログイン中のユーザーへ Google・X を連携（`linkWithPopup`）・解除（`unlink`）できる。連携すると、どちらでも同じユーザーとしてログインできる。
- Firebase ユーザーへの連携を追加・削除するだけで、Firebase UID とアプリ内のデータは変わらない。
- 最後に残ったログイン方法は解除できない。
- 別のユーザーで使用中のアカウントは連携できない。未登録のまま認証だけ済ませた Firebase ユーザーがある場合も同様に拒否される。
- 「Googleアカウントを変更」は Google を連携している場合だけ表示する。変更後は変更先の Google アカウントだけを持つ Firebase ユーザーになるため、X は改めて連携する必要がある。X を連携している場合は変更欄に注意を表示する。

## 再認証

- ユーザー名変更、退会、Google アカウント変更などの再認証は、連携済みの認証プロバイダで行う。Google を連携していれば Google、X だけなら X を使う。
- Google ではログイン中のメールアドレスを事前選択させる。別アカウントを選ぶと Firebase が `auth/user-mismatch` で拒否する。

## Firebase・X の設定

- Firebase Authentication で Google と Twitter（X）のプロバイダを有効にする。
- Twitter（X）プロバイダには、X Developer Console のアプリの API Key / API Key Secret（OAuth 1.0a の Consumer Key / Secret）を設定する。
- X のアプリ設定で OAuth 1.0a を有効にし、コールバック URL に Firebase が表示する `https://<authDomain>/__/auth/handler` を登録する。
- Firebase で「メールアドレスごとに1つのアカウント」を使う場合、既存の Google アカウントと同じメールアドレスを持つ X で新しくログインすると `auth/account-exists-with-different-credential` で拒否される。元の方法でログインし、設定から X を連携する。
- フロントの環境変数に X の秘密情報は設定しない。

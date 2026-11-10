# ログイン方法（Google・X）

## 概要

- 通常のログイン（`/login`）、新規登録（`/register`）、スタッフ向けのメンテナンス中ログインでは、Google と X のどちらでもログインできる（X は feature-flag `x_login` が有効な環境のみ。後述）。
- Firebase Authentication のポップアップ認証（`signInWithPopup`）を使い、Turnstile と既存の `/internal/auth/login`・`/internal/auth/signup` で検証する。API は Firebase の ID トークンだけを検証するため、認証プロバイダごとの API の違いはない。
- 認証プロバイダの一覧と表示順は `src/constants/authProviders.ts` で管理する。X は Firebase 上では `twitter.com` として扱われる。
- X でのログインは feature-flag `x_login` で切り替える（develop / staging で有効、production で無効）。無効な環境では、ログイン・新規登録・メンテナンス中ログインの X ボタンと、設定の「ログイン方法」の X の行を表示せず、`@ID` の取得もしない。切り替えるフラグは `src/constants/authProviders.ts` の各定義の `featureFlag` に持たせ、画面に出す一覧は `src/lib/authProviders.ts` の `VISIBLE_AUTH_PROVIDERS` にまとめている。
- 連携済みアカウントの判定や再認証の認証プロバイダ選択は、フラグに関係なく全プロバイダを対象にする。本番の Firebase で X を有効にする前にフラグを有効にしないこと。
- ログイン画面では Turnstile を1回確認すれば、どちらのボタンでもログインできる。

## 新規登録

- Google または X で認証し、未登録であればユーザー名の入力へ進む。登録済みのアカウントで認証した場合はサインアウトし、ログイン画面へ案内する。
- 認証済みのアカウントは、Google はメールアドレス、X は `@ID` で表示する。`@ID` は登録完了前で API にまだ保存できないため、Firebase の認証結果（`getAdditionalUserInfo(result).username`）から読み取る。ページを再読み込みして認証結果がない場合は表示名で代用する。

## ログイン方法の連携・解除

- 設定の「アカウント」にある「ログイン方法」から、ログイン中のユーザーへ Google・X を連携（`linkWithPopup`）・解除（`unlink`）できる。連携すると、どちらでも同じユーザーとしてログインできる。
- Firebase ユーザーへの連携を追加・削除するだけで、Firebase UID とアプリ内のデータは変わらない。
- 最後に残ったログイン方法は解除できない。画面に表示しない認証プロバイダ（`x_login` が無効な環境の X）は残る方法に数えない。
- 別のユーザーで使用中のアカウントは連携できない。未登録のまま認証だけ済ませた Firebase ユーザーがある場合も同様に拒否される。
- 「Googleアカウントを変更」は Google を連携している場合だけ表示する。変更後は変更先の Google アカウントだけを持つ Firebase ユーザーになるため、X は改めて連携する必要がある。X を連携している場合は変更ダイアログに注意を表示する。

## X の @ID 表示

- 設定の「ログイン方法」では、X を `@ID` で表示する。Firebase の連携情報（`providerData`）には表示名と数値のユーザーIDしかなく、`@ID` は含まれない。
- `@ID` は API の `GET /internal/me/x-account` から取得する。API は、X での認証直後にフロントが送る OAuth 1.0a のアクセストークン（`TwitterAuthProvider.credentialFromResult`）で X API の `GET /2/users/me` を呼び、X が返した値だけを保存する。数値IDを Firebase に連携済みの X と照合するため、フロントから別の `@ID` を送り込むことはできない。
- 取得し直すのは、X でのログイン・新規登録の完了時・設定からの連携のとき（`src/usecases/auth/syncXAccount.ts`）。アクセストークンは認証直後にしか得られないため、それ以外のタイミングでは更新されない。X 側で `@ID` を変えた場合は、次に X でログインするまで古い `@ID` のままになる。
- 未登録の X アカウントでログイン画面から新規登録へ進んだ場合は、ログイン画面での認証結果をメモリ上で新規登録画面へ引き継ぎ、登録完了時に取得する。ページを再読み込みした場合は引き継がれない。
- 再認証では取得しない。退会の直前に再認証するため、取得の要求が退会と並行して届き、削除済みのユーザーへ保存しようとするのを避ける。
- 保存済みの数値IDが現在の連携先と一致しない場合（連携し直した直後など）や、まだ取得していない場合は、従来どおり表示名で表示する。
- 取得に失敗しても認証の処理は止めない。

## 再認証

- ユーザー名変更、退会、Google アカウント変更などの再認証は、連携済みの認証プロバイダで行う。Google を連携していれば Google、X だけなら X を使う。
- Google ではログイン中のメールアドレスを事前選択させる。別アカウントを選ぶと Firebase が `auth/user-mismatch` で拒否する。
- 再認証、アカウント選択、ログイン方法の連携のポップアップをユーザーが閉じた場合（`auth/popup-closed-by-user`）は、本人の意思による中断として扱う。エラーは表示せず、操作前の状態に戻す。判定は `isAuthPopupClosedError`（`src/utils/errorMessage.ts`）に集約している。
- 退会のエラーは確認ダイアログの中だけに表示し、ダイアログを閉じるとクリアする。
- ユーザー名変更と退会のエラー文言は `resolveReauthErrorMessage`（`src/pages/settings/reauthErrorMessage.ts`）で決める。別アカウントでの再認証（`auth/user-mismatch`）と再認証の有効期限切れ（`recent_sign_in_required`）は専用の文言、それ以外はエラーコードやステータスに応じた文言にする。ユーザー名変更は入力欄、退会は確認ダイアログに表示する。
- Google アカウント変更では、変更先を選び直す必要があるエラー（`recent_sign_in_required` など）はウィザード本体に、別アカウントでの本人確認（`auth/user-mismatch`・`invalid_credentials`）などやり直せるエラーは本人確認ダイアログに表示する。
- 退会後と、Google アカウント変更後にセッションを変更先へ切り替えられなかった場合は、`discardLocalSession`（`src/usecases/auth/discardLocalSession.ts`）で端末内のログイン状態とキャッシュを破棄してログイン画面へ遷移する。サーバー側の処理は完了しているため、サインアウトやキャッシュの削除に失敗しても遷移を止めない。

## ロゴ

ログイン方法のロゴは `src/components/auth/AuthProviderIcon.tsx` で表示する。各社の公式アセットを加工せずに使い、自作・トレースしたロゴは使わない。ロゴは20pxで固定し、プロバイダ間で並びがそろうよう、28pxの丸い枠の中央に置く。

- Google: [Sign in with Google のブランドガイドライン](https://developers.google.com/identity/branding-guidelines) が配布する「G」ロゴ（`https://developers.google.com/static/identity/images/g-logo.png`）を `src/assets/brands/google-g-logo.png` に置いている（2026年11月取得、グラデーション版）。
  - 標準色のまま使う。単色化・色変更・サイズ変更（20px で表示）はしない。
  - G は白い背景の上に置く規定がある。テーマの面の色によらず満たすため、枠を白丸（`--color-brand-google-logo-bg`）にしている。
  - ボタン自体の推奨色はライト（塗り `#FFFFFF`・線 `#747775`・文字 `#1F1F1F`）、ダーク（塗り `#131314`・線 `#8E918F`・文字 `#E3E3E3`）、ニュートラル（塗り `#F2F2F2`・線なし・文字 `#1F1F1F`）。
  - 操作ボタンでは「G」だけにせず、ボタンの枠と文言（「Googleでログイン」「Googleで続ける」など）を付ける。他のログイン方法より目立たなくしない。
  - ボタン画像一式は `https://developers.google.com/static/identity/images/signin-assets.zip` で配布されている。
- X: [X Brand Quick Guide For External Partners](https://about.x.com/content/dam/about-twitter/x/brand-toolkit/x-brand-guidelines.pdf)（表紙の表記は August 2023 v1.0）の `logo.svg`（`https://about.x.com/content/dam/about-twitter/x/brand-toolkit/logo.svg`）のパスをそのまま埋め込んでいる。
  - 色は黒（`#000000`）か白（`#FFFFFF`）だけ。原則は白背景に黒・黒背景に白で、単色でない環境では明るい背景に黒・暗い背景に白とする。明るいテーマでは黒、暗いテーマでは白を、デザイントークン `--cs-color-brand-x-logo` で切り替える。枠は透明にする。
  - 形を崩さず、ロゴの周囲に余白を空ける。
  - 画面上の呼び方は「X」を使い、「Twitter」とは書かない（Firebase の `twitter.com` や、Firebase コンソール上のプロバイダ名「Twitter」など外部の表記は除く）。

## Firebase・X の設定

- Firebase Authentication で Google と Twitter（X）のプロバイダを有効にする。
- Twitter（X）プロバイダには、X Developer Console のアプリの API Key / API Key Secret（OAuth 1.0a の Consumer Key / Secret）を設定する。
- X のアプリ設定で OAuth 1.0a を有効にし、コールバック URL に Firebase が表示する `https://<authDomain>/__/auth/handler` を登録する。
- Firebase で「メールアドレスごとに1つのアカウント」を使う場合、既存の Google アカウントと同じメールアドレスを持つ X で新しくログインすると `auth/account-exists-with-different-credential` で拒否される。元の方法でログインし、設定から X を連携する。
- フロントの環境変数に X の秘密情報は設定しない。

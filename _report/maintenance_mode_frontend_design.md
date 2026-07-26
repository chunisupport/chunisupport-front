# フロントエンド メンテナンスモード 実装計画・設計書

## 0. 文書の位置付け

本書は、Cloudflare Pages 上で配信される chunisupport-front にメンテナンスモード対応を追加するための実装計画・設計書である。

API側の契約は `../chunisupport-api/_report/maintenance_mode_api_design.md` を正とし、本書では次を扱う。

- 一般利用者向けメンテナンス画面
- API停止時の接続エラー画面
- ADMIN / EDITOR向けの非公開導線ログイン画面
- ADMIN向けメンテナンス開始・終了画面
- アプリ全体のAPIエラー検知と状態管理
- メンテナンス終了の再確認

nginx、VPSの制御、APIサーバー内部の実装は対象外とする。

## 1. 目的

- APIが計画メンテナンス中であることを、静的フロントエンドから明確に案内する。
- APIに接続できない状態を、計画メンテナンスと誤認させない。
- メンテナンス中もADMIN / EDITORがFirebase認証を行い、通常の管理・編集画面を利用できるようにする。
- ADMINが画面からコメント付きでメンテナンスを開始・終了できるようにする。
- 任意のAPI呼び出しが `503 maintenance_mode` を返した場合、各ページで個別実装せずアプリ全体をメンテナンス表示へ切り替える。
- メンテナンスコメントを安全なプレーンテキストとして表示する。
- 通常時の既存画面、認証遷移、APIエラー表示を壊さない。

## 2. スコープ

### 2.1 対象

- アプリケーション稼働状態の共有Store / Primitive
- 初期表示時の状態確認
- APIエラーからのメンテナンス検知
- メンテナンス画面
- API接続不能画面
- 非公開導線のスタッフログイン画面
- 既存ログインフォームの共通コンポーネント化
- ADMIN向けメンテナンス管理画面
- メンテナンス状態の自動・手動再確認
- 型、定数、エラーコード、ルート定義
- 単体テストとビルド検証

### 2.2 対象外

- nginxが返すメンテナンスHTML
- VPS再起動やAPIプロセス再起動の操作
- Cloudflare Pagesのデプロイ操作を管理画面から実行する機能
- メンテナンス開始・終了の予約
- リッチテキスト、Markdown、HTMLによるメンテナンスコメント
- 一般利用者が編集中だった未保存フォームの復元
- 失敗した更新リクエストの自動再送
- 外部API `/v1`・`/compat` 利用者向けのUI

## 3. API契約

### 3.1 状態確認

```http
GET /internal/system/status
Cache-Control: no-store
```

```ts
export type SystemStatus = 'operational' | 'maintenance'

export interface SystemStatusDTO {
  status: SystemStatus
  comment: string
  updated_at: string
}
```

APIプロセスが動作している場合、通常時・メンテナンス中とも `200 OK` を返す。

### 3.2 状態変更

```http
PUT /internal/admin/maintenance
Authorization: Bearer <Firebase ID token>
Content-Type: application/json
```

```ts
export interface UpdateMaintenanceRequest {
  enabled: boolean
  comment: string
}
```

ADMINだけが実行可能で、成功レスポンスは `SystemStatusDTO` とする。

### 3.3 メンテナンスエラー

```http
HTTP/1.1 503 Service Unavailable
Retry-After: 60
Cache-Control: no-store
```

```json
{
  "error": {
    "status": 503,
    "code": "maintenance_mode"
  }
}
```

`service_unavailable` や単なるHTTP 503は、メンテナンス画面へ切り替える根拠にしない。必ず `error.code === "maintenance_mode"` を確認する。

## 4. アプリケーション状態モデル

計画メンテナンスと接続障害を区別する。

```ts
export type AvailabilityState =
  | { kind: 'checking' }
  | {
      kind: 'operational'
      updatedAt: string
      checkedAt: number
    }
  | {
      kind: 'maintenance'
      comment: string
      updatedAt: string | null
      retryAfterSeconds: number
      checkedAt: number
    }
  | {
      kind: 'unavailable'
      retryCount: number
      checkedAt: number
    }
```

### 4.1 状態の意味

| `kind` | 意味 | 一般利用者向け表示 |
|---|---|---|
| `checking` | 初回確認中 | 共通 `Loading` |
| `operational` | APIが通常稼働中 | 通常アプリ |
| `maintenance` | APIが計画メンテナンスを明示 | メンテナンス画面 |
| `unavailable` | API状態を確認できない | 接続エラー画面 |

状態は `src/stores/availability.ts` のSolid Storeとして一元管理する。コンポーネントごとに独立したSignalを作らない。

`authSession` は既存Storeを継続利用し、稼働状態Storeへユーザー情報を複製しない。

`GET /internal/system/status` の取得に成功した状態では、`operational` と `maintenance`
のどちらもAPIが返した `updated_at` を保持する。通常稼働中もADMIN管理画面で最終更新日時を
表示するため、`operational` にも `updatedAt` を持たせる。

通常APIの `503 maintenance_mode` を先に検知した時点では更新日時をまだ取得できないため、
その一時状態に限って `maintenance.updatedAt` を `null` とする。直後の状態確認に成功したら
APIが返した日時で補完する。

### 4.2 スタッフ判定

```ts
const isMaintenanceStaff = (accountType: AccountType | undefined): boolean =>
  accountType === 'ADMIN' || accountType === 'EDITOR'
```

この判定は純粋関数として共通化し、ルートゲート、ログイン成功後、テストで同じ関数を利用する。

フロントエンドのロール判定は表示制御にすぎない。APIの認可を代替しない。

## 5. 初期表示フロー

Cloudflare Pagesの静的ファイルはAPI停止中も配信できるため、JavaScript起動後にAPI状態を確認する。

```text
Cloudflare Pagesからアプリ読込
  ↓
GET /internal/system/status
  ├─ operational
  │    └─ 通常アプリを表示
  ├─ maintenance
  │    ├─ Firebaseセッションなし → メンテナンス画面
  │    └─ Firebaseセッションあり
  │         ├─ /internal/me がADMIN / EDITORとして成功 → 通常アプリ
  │         └─ その他 → メンテナンス画面
  └─ 接続失敗・不正応答
       └─ 接続エラー画面
```

### 5.1 状態確認リクエスト

- `cache: "no-store"` を指定する。
- 認証トークンを付けない。
- `fetchWithAuth` を経由させず、状態確認専用関数にする。
- レスポンスの `status`、`comment`、`updated_at` を実行時に検証する。
- 同時呼び出しは1つのin-flight Promiseへ集約する。
- コンポーネント破棄時や再確認の置き換えには `AbortController` を利用する。

### 5.2 既存スタッフセッションの復元

状態が `maintenance` であっても、既存のFirebaseセッションが残っている可能性がある。

1. `authSession` が認証済みでユーザー情報を保持している場合は、検証済みの既知ユーザーを即時利用する。
2. 認証状態が未確定またはエラーの場合だけ、`auth.authStateReady()` でFirebaseの初期状態確定を待つ。
3. `auth.currentUser` が存在する場合だけ `resolveAuthSession(() => fetchMe(...))` を実行する。
4. `authSession.user.account_type` が `ADMIN` / `EDITOR` ならアプリを表示する。
5. `maintenance_mode`、認証失敗、PLAYERの場合はメンテナンス画面を維持する。

既知ユーザーを利用中に通常APIから `maintenance_mode` を受けた場合は、トークン失効や権限変更の
可能性があるため、その認証判定を未検証へ戻して `/internal/me` を再実行する。再検証中はアプリ本体を
閉じ、失敗した場合はメンテナンス画面を維持する。ADMIN自身のPUT成功による状態遷移は200レスポンス
なので、この再検証は発生せず管理画面を維持できる。

通常利用者に対して、メンテナンス確認のためだけにGoogleログインを要求してはならない。

## 6. 動的なメンテナンス検知

初回状態確認後にメンテナンスが開始される可能性があるため、既存の `fetchWithAuth` で全APIエラーを監視する。

### 6.1 判定

エラーレスポンスをJSONとして読み取った後、次の場合だけ稼働状態を `maintenance` へ変更する。

```ts
response.status === 503 && error?.error?.code === 'maintenance_mode'
```

検出時は、コメントを取得するため `GET /internal/system/status` を1回だけ再取得する。

状態確認が一時的に失敗しても、APIが返した `maintenance_mode` という事実を優先し、空コメントのメンテナンス状態へ遷移する。後続の再確認でコメントを補完する。

### 6.2 対象APIクライアント

現状、API通信の大半は `fetchWithAuth` を経由している。例外である `fetchApiRoot` は共通クライアント経由へ変更する。

状態確認APIだけは循環を避けるため、専用の生 `fetch` を利用する。

新しい汎用HTTPクライアント層を追加する必要はない。既存 `fetchWithAuth` と状態確認関数の2経路に限定する。

### 6.3 更新リクエスト

メンテナンス開始と競合して `POST` / `PUT` / `PATCH` / `DELETE` が失敗しても、そのリクエストを自動再送しない。

自動再送は二重登録や二重更新を起こし得る。メンテナンス終了後はページを再読み込みし、必要であれば利用者が操作をやり直す。

## 7. アプリケーションゲート

Router内の最上位に `ApplicationAvailabilityGate` を配置し、個別ページではメンテナンス判定を行わない。

### 7.1 表示規則

| 稼働状態 | 認証状態 | 表示 |
|---|---|---|
| `checking` | 任意 | `Loading` |
| `operational` | 任意 | 通常ルート |
| `maintenance` | ADMIN / EDITOR | 通常ルート |
| `maintenance` | その他 | `MaintenancePage` |
| `unavailable` | 任意 | `ApiUnavailablePage` |

非公開導線のスタッフログインルートは、このゲートに遮断されず常に表示できる例外ルートとする。

ゲートは既存ページをNavBarごと置き換え、一般利用者がメンテナンス中に操作を継続できないようにする。

### 7.2 ルート構成

追加ルート:

```text
/maintenance/login
/admin/maintenance
```

- `/maintenance/login` はNavBarや通常ログイン画面からリンクしない。
- `/admin/maintenance` は既存 `RequireRole allowedRoles={["ADMIN"]}` で保護する。
- ADMIN管理メニューに「メンテナンス管理」を追加する。
- `src/constants/routes.ts` にパス定数を定義し、文字列を複数箇所へ直書きしない。

Solid Routerの親レイアウトまたは同等のトップレベル構成を使い、既存ルートをまとめて `ApplicationAvailabilityGate` の配下へ置く。各Routeへ同じHOCを繰り返し追加しない。

## 8. 一般利用者向けメンテナンス画面

### 8.1 表示内容

- Lucideのメンテナンスを表すアイコン
- 見出し「メンテナンス中です」
- APIから取得した自由記述コメント
- 更新日時
- ChuniSupport公式Xアカウントのタイムライン

スタッフログインへのリンクは表示しない。URLを知っている利用者だけが `/maintenance/login` へ直接アクセスする。
利用者が任意のタイミングで状態を再確認する場合は、ブラウザの再読み込みを利用する。
Xウィジェットを読み込めない環境では、公式Xアカウントへの通常リンクをフォールバックとして表示する。

### 8.2 コメント表示

- JSXのテキストノードとして描画する。
- `innerHTML`、`innerText`への直接代入、HTMLパーサーを利用しない。
- 改行は `whitespace-pre-wrap` で表示する。
- 長い単語・URLでも画面をはみ出さないよう `break-words` を利用する。
- 最大行幅を抑え、200%ズームでも横スクロールを要求しない。

### 8.3 再確認

- メンテナンス中は60秒ごとに状態確認する。
- 通常稼働中は一般画面で定期確認せず、ADMIN向けメンテナンス管理画面を表示している間だけ60秒ごとに状態確認する。
- `setInterval` ではなく、前回完了後に次回を予約する `setTimeout` を使い、リクエスト重複を防ぐ。
- タブが非表示の間はポーリングを止める。
- `visibilitychange` で表示状態へ戻ったときは即時確認する。
- `online` イベントを受けたときも即時確認する。
- 同時実行はin-flight Promiseでまとめる。

既知のメンテナンス状態で再確認に失敗した場合は、最後に取得できたコメントを残し、接続エラー画面へ即座に切り替えない。

`operational` を確認した場合は `window.location.reload()` で現在URLを再読込する。これにより、メンテナンス前に失敗したResourceや認証状態を確実に初期化する。

## 9. API接続不能画面

APIへ接続できない、状態確認レスポンスが不正、メンテナンス以外の5xxが返る場合は `ApiUnavailablePage` を表示する。

### 9.1 表示内容

- 見出し「サービスに接続できません」
- ネットワーク接続を確認し、時間を置いて再試行する旨
- 「再試行」ボタン

原因を確認できていないため、「メンテナンス中」とは表示しない。

初回接続失敗時の自動再試行は、5秒、15秒、30秒、60秒の順で間隔を広げ、以後60秒を上限とする。タブ非表示中は停止し、オンライン復帰時は即時再試行する。

API停止中はスタッフログインもAPI検証を完了できない。Firebaseのポップアップだけ成功しても、バックエンドログインが成功するまではアプリを開放しない。

## 10. スタッフ用非公開導線ログイン画面

### 10.1 パスと位置付け

```text
/maintenance/login
```

このパスは通常ナビゲーション、メンテナンス画面、フッターからリンクしない。

ただし、URLの秘匿性はセキュリティ境界にしない。URLが知られても、APIとフロントの両方でADMIN / EDITORだけを許可する。

サイト全体ですでに `robots: noindex` が設定されているため、この画面専用の検索除外実装は不要である。

### 10.2 画面

- 見出し「スタッフログイン」
- 通常ログイン画面と同じGoogleログインフォーム
- ADMIN / EDITOR専用であることを短く表示
- エラーはフォーム操作の近くへ表示
- 新規登録リンクは表示しない
- トップページへのリンクも表示しない

### 10.3 成功後

- APIが返した `UserDTO.account_type` を確認する。
- ADMINは既定で `/admin` へ遷移する。
- EDITORは既定で `/editor/songs` へ遷移する。
- 安全な同一オリジンの `redirect` クエリがある場合は、それを優先できる。
- `setAuthenticatedUser(user)` で既存 `authSession` を更新する。

### 10.4 許可されないユーザー

通常稼働中にPLAYERがこの画面からログインした場合でも、フロントエンド側でスタッフ以外を拒否する。

- Firebaseからサインアウトする。
- `authSession` をクリアする。
- 「このログイン画面は管理者・編集者専用です」とフォーム付近に表示する。
- 新規登録画面へ遷移しない。

メンテナンス中はAPI自体がPLAYERへ `503 maintenance_mode` を返すため、APIが最終的な認可を保証する。
`invalid_token` は失効・不正トークンと未登録ユーザーをAPI応答だけでは区別できないため、
セッションを破棄したうえで「スタッフアカウントを確認できませんでした。再度ログインしてください。」と表示する。

## 11. ログインコンポーネントの共通化

現在の `src/pages/auth/Login/Login.tsx` は、Turnstile、Googleポップアップ、APIログイン、画面遷移を1コンポーネントに持っている。

通常ログインとスタッフログインでフォームを複製せず、次のように責務を分ける。

```text
src/components/auth/GoogleLoginForm.tsx
  - Turnstile表示
  - 送信中状態
  - Googleログインボタン
  - フォーム内エラー
  - 成功したUserDTOを親へ通知

src/usecases/auth/loginWithGoogle.ts
  - Firebase signInWithPopup
  - POST /internal/auth/login
  - UserDTOを返す

src/pages/auth/Login/Login.tsx
  - 未登録ユーザーの登録画面遷移
  - 通常のログイン後遷移

src/pages/maintenance/MaintenanceLoginPage.tsx
  - ADMIN / EDITOR判定
  - スタッフ用遷移
  - 非スタッフのサインアウト
```

共通フォームは遷移先やロール要件を知らない。ページ固有の判断をpropsの真偽値で増やさず、成功・失敗結果を親へ返す。

通常ログイン画面の既存挙動は維持する。

- 未登録Firebaseユーザーは新規登録画面へ遷移する。
- `redirect` クエリを安全に処理する。
- Turnstile失敗時は再検証する。
- 認証済み利用者のリダイレクトを維持する。

## 12. ADMIN向けメンテナンス管理画面

### 12.1 ルート

```text
/admin/maintenance
```

既存のADMIN管理メニューへカードを追加し、`RequireRole allowedRoles={["ADMIN"]}` で保護する。EDITORにはリンクを表示せず、直接アクセスしても既存の403画面へ遷移させる。

### 12.2 表示項目

- 現在状態: 「通常稼働中」または「メンテナンス中」
- 最終更新日時
- メンテナンスコメント入力欄
- Unicodeコードポイント単位の文字数表示
- 通常稼働中は「メンテナンスを開始」ボタン
- メンテナンス中は「コメントを更新」と「メンテナンスを終了」ボタン

状態は色だけで表現せず、アイコンとテキストを併用する。

### 12.3 コメント入力

- 共通領域に複数行入力コンポーネントがないことを確認したうえで、Kobalte `TextField` の `Label` / `TextArea` を使ってラベルと入力欄を関連付ける。
- HTMLの `maxlength` はUTF-16コードユニット基準で、APIのUnicodeコードポイント基準と一致しない。`maxlength={1000}` を入力制限の根拠にせず、`Array.from(value).length` 相当の純粋関数で1,000コードポイントを検証する。
- 開始時は空白だけのコメントを許可しない。
- 改行を許可する。
- CRLFとCRはLFへ統一し、前後のUnicode空白を除去してからAPIへ送信する。
- LF以外のUnicode `Cc` 制御文字は、前後にある場合を含めて許可しない。
- 入力エラーはtextareaの直下へ表示する。
- APIから取得した既存コメントを編集初期値とする。

文字数計算と入力検証は `src/utils/maintenanceComment.ts` へ切り出し、単体テストを追加する。

### 12.4 確認操作

メンテナンス開始・コメント更新・終了は全利用者へ影響するため、Kobalte `AlertDialog`
で明示確認する。

- 開始・コメント更新の確認では、表示予定の正規化済みコメントを確認できるようにする。
- 終了確認では、「一般利用者のAPI利用を再開する」ことを示す。
- 確定処理中はボタンを無効化する。
- 二重送信を防止する。
- 成功時はAPIレスポンスをStoreへ反映する。
- 失敗時は操作ボタン付近へエラーを表示する。

既存の共通ラッパーで要件を満たせないことを確認したうえで、画面専用の確認Dialogを定義する。単一画面のためだけに汎用Dialog抽象を新設しない。

### 12.5 ADMINが開始した直後

APIレスポンスが `maintenance` になったら稼働状態Storeも更新する。

ADMINは既に `authSession` 上でスタッフと判定できるため、アプリケーションゲートは管理画面を閉じない。ADMINはそのまま終了操作や他の管理操作を続けられる。

### 12.6 外部の状態変更との同期

管理画面を開いた時点で状態APIを再取得し、操作可能になる前に最新状態へ同期する。
初回同期に失敗または中断した場合は古いStoreの状態で操作を許可せず、エラーと再確認ボタンだけを表示する。再確認が成功してから操作フォームを表示する。
共有ポーリングによる後続の状態確認が成功した場合も、成功反映の通知を受けてフォームを自動復帰する。

通常稼働中に別のADMINがメンテナンスを開始した場合も検知できるよう、管理画面を表示中かつオンラインの間だけ60秒ごとに状態確認する。タブ表示復帰・オンライン復帰時は即時確認し、画面を離れた場合は通常稼働中の定期確認を停止する。

状態確認はアプリケーションゲートの単一ポーリングControllerと共有し、画面専用のControllerや独立したin-flight Promiseを作らない。

## 13. APIクライアントと型の変更

### 13.1 追加

```text
src/api/maintenance.ts
src/stores/availability.ts
src/usecases/availability/refreshAvailability.ts
src/usecases/availability/availabilityPolling.ts
src/utils/maintenanceError.ts
src/utils/maintenanceComment.ts
```

`src/api/maintenance.ts`:

- `fetchSystemStatus(options?)`
- `updateMaintenance(payload)`

`src/types/api.ts`:

- `maintenance_mode` を `ErrorCode` に追加する。
- `SystemStatusDTO` と更新リクエスト型を追加する。
- `AccountType` の既存定義をスタッフ判定で再利用する。

### 13.2 既存 `fetchWithAuth`

- エラーJSONを1回だけ読み取る。
- `maintenance_mode` を検出したらStore更新処理へ通知する。
- 既存の401リダイレクト処理より先にメンテナンス判定する。
- `maintenance_mode` で `authSession` をクリアしない。
- アプリケーションゲート側で既知ユーザーを保持したまま認証状態を未検証へ戻し、スタッフ権限を再検証する。
- 従来どおり `status` と `code` を付けたErrorをthrowする。

一般利用者のメンテナンス応答は401ではなく503であるため、通常ログインへ自動リダイレクトしてはならない。

### 13.3 エラーメッセージ

`maintenance_mode` は一般のエラーメッセージ表示に到達する前にアプリケーションゲートへ接続する。

型の完全性のため `errorMessages` にも対応文言を追加するが、通常は個別ページのエラーバナーとして表示しない。

## 14. ポーリングとライフサイクル

ポーリング処理はコンポーネントへ直接書かず、PrimitiveまたはUsecaseへ切り出す。

責務:

- 次回タイマーの管理
- in-flightリクエストの共有
- `visibilitychange` / `online` の購読
- クリーンアップ
- 接続失敗回数の管理
- メンテナンス中と接続不能時の間隔切り替え
- ADMIN向けメンテナンス管理画面に限った通常稼働中の60秒確認

SolidJSのコンポーネント関数は初回だけ実行されるため、状態参照はSignal / Storeのアクセサー内で行う。propsやStore値をコンポーネント直下で分割代入してリアクティビティを失わない。

`onCleanup` でタイマー、イベントリスナー、AbortControllerを必ず破棄する。

## 15. アクセシビリティ

### 15.1 画面構造

- メンテナンス画面と接続不能画面は `<main>` 内に置く。
- ページごとに1つの `<h1>` を設ける。
- 装飾目的のLucideアイコンには `aria-hidden="true"` を付ける。
- ボタンには視覚文言を付け、アイコンだけに依存しない。
- `useDocumentTitle` で「メンテナンス」「接続エラー」「スタッフログイン」「メンテナンス管理」を設定する。

### 15.2 動的状態

- 初回読込は既存 `Loading` を使う。
- 再確認中のたびにライブリージョンで読み上げず、スクリーンリーダーを過剰に通知しない。
- 手動再確認の結果は `aria-live="polite"` の単一領域で通知する。
- API接続が失われた瞬間など操作継続不能への切り替えは、ページ見出しとフォーカス移動で認識可能にする。
- 状態変更後は `<main tabindex="-1">` または見出しへプログラム的にフォーカスする。

### 15.3 フォーム

- Kobalte `TextField` でtextareaへ可視ラベルを付ける。
- 補足とエラーは `aria-describedby` で関連付ける。
- エラー時は `aria-invalid="true"` を設定する。
- フォーカスリングと色は既存デザイントークンを使う。
- 通常テキスト4.5:1、UI境界3:1以上のコントラストを維持する。

## 16. セキュリティ

- メンテナンスコメントをHTMLとして描画しない。
- 非公開導線のURLを認可手段にしない。
- ADMIN / EDITOR判定はAPIを正とする。
- `redirect` クエリは既存 `sanitizeRedirectPath` / `resolvePostLoginRedirectPath` を再利用し、外部URLへ遷移させない。
- Firebase ID token、Turnstile token、コメント全文をconsoleへ出力しない。
- API接続失敗時に内部URL、レスポンス本文、例外詳細を画面へ表示しない。
- Cloudflare PagesとAPIのCORSは許可Originを限定し、メンテナンス応答にも適用する。

## 17. 主なファイル配置

追加候補:

```text
src/api/maintenance.ts

src/stores/availability.ts

src/usecases/availability/refreshAvailability.ts
src/usecases/availability/availabilityPolling.ts
src/usecases/auth/loginWithGoogle.ts

src/utils/maintenanceError.ts
src/utils/maintenanceComment.ts
src/utils/maintenanceRole.ts

src/components/availability/ApplicationAvailabilityGate.tsx
src/components/auth/GoogleLoginForm.tsx

src/pages/maintenance/MaintenancePage.tsx
src/pages/maintenance/ApiUnavailablePage.tsx
src/pages/maintenance/MaintenanceLoginPage.tsx
src/pages/admin/AdminMaintenancePage.tsx
```

変更候補:

```text
src/App.tsx
src/api/fetchWithAuth.ts
src/api/root.ts
src/pages/auth/Login/Login.tsx
src/pages/admin/AdminPage.tsx
src/types/api.ts
src/constants/routes.ts
src/constants/pageTitles.ts
```

画面文言、ポーリング間隔、コメント最大文字数は専用定数へまとめる。新規・変更する公開関数とコンポーネントにはプロジェクト規約どおりTSDocを付ける。

## 18. テスト計画

### 18.1 純粋関数

- `maintenance_mode` だけをメンテナンスとして判定する。
- HTTP 503だけではメンテナンスと判定しない。
- `service_unavailable` をメンテナンスと判定しない。
- ADMIN / EDITORをスタッフと判定する。
- PLAYERをスタッフと判定しない。
- コメントの前後空白、空文字、1,000 / 1,001コードポイントを検証する。
- サロゲートペアを1コードポイントとして数える。

### 18.2 Store / 状態更新

- 初期状態が `checking` になる。
- 状態確認成功で `operational` / `maintenance` が設定される。
- メンテナンスエラー検知後に状態確認が1回へ集約される。
- 既知のメンテナンス中に再確認失敗してもコメントを保持する。
- 初回確認失敗時は `unavailable` になる。
- ADMIN更新成功時にStoreが即時更新される。

### 18.3 ポーリング

- メンテナンス中は60秒後に再確認する。
- 通常稼働中はメンテナンス管理画面だけ60秒後に再確認する。
- 接続不能時は5、15、30、60秒へ拡大する。
- タブ非表示時は次回通信を行わない。
- 表示復帰・オンライン復帰で即時再確認する。
- 現在状態と画面に確認間隔がないControllerは、表示・オンライン復帰時も通信しない。
- 同時再確認を重複実行しない。
- cleanup後にタイマーやイベントが残らない。

時間依存テストはタイマー関数を注入し、実時間待機を行わない。

### 18.4 認証

- 通常ログインが既存遷移を維持する。
- スタッフログイン成功時にADMIN / EDITORの既定画面へ遷移する。
- PLAYERはサインアウトされ、専用エラーが表示される。
- メンテナンス中のPLAYER `503` で新規登録画面へ遷移しない。
- スタッフログインの `invalid_token` ではスタッフ未登録と断定せず、再ログインを案内する。
- 安全でない `redirect` を拒否する。
- 既存スタッフセッションがある場合はメンテナンス中も通常アプリを表示する。
- 既知スタッフが `maintenance_mode` を受けた場合は、古いロールを信頼せず再検証する。

### 18.5 ADMIN管理

- ADMINだけがルートを表示できる。
- 初回状態同期の失敗時は操作を解放せず、再確認後にフォームを表示する。
- 空コメントでは開始できない。
- 確認Dialogを経由しない限り更新APIを呼ばない。
- 二重送信しない。
- 開始・終了成功時に状態と表示を更新する。
- APIエラーを操作位置の近くに表示する。

### 18.6 画面・ルーター

- 初回状態確認中に通常ページを先に表示しない。
- 一般利用者はメンテナンス画面を見る。
- ADMIN / EDITORは通常ルートを利用できる。
- 非公開導線ログインはメンテナンスゲート中も表示できる。
- API接続不能時は接続エラー画面になり、メンテナンスと表示しない。
- メンテナンス終了確認後に現在URLを再読込する。
- CORS許可環境で `maintenance_mode` レスポンスを読み取れる。

## 19. 実装順序

1. API実装を先に完成させ、状態確認・更新・エラー契約を確定する。
2. API型、`maintenance_mode` エラーコード、純粋な判定関数のテストを追加する。
3. 稼働状態Storeと状態確認APIをTDDで実装する。
4. ポーリングとブラウザーライフサイクル処理をTDDで実装する。
5. `fetchWithAuth` へメンテナンス検知を追加する。
6. `ApplicationAvailabilityGate`、メンテナンス画面、接続不能画面を実装する。
7. 既存ログイン処理を共通フォームとログインUsecaseへ分離する。
8. スタッフ用非公開導線ログイン画面を実装する。
9. ADMIN向けメンテナンス管理画面と管理メニュー導線を実装する。
10. ルーターテスト、認証テスト、アクセシビリティ確認を行う。
11. 関連する `_report/API.md` または画面仕様書を更新する。
12. 必須の品質確認コマンドを実行する。

## 20. デプロイ順序

フロントエンドを先にデプロイすると、まだ存在しない状態確認APIが404となり、全利用者へ接続エラー画面を表示してしまう。そのため次の順序を守る。

1. メンテナンス機能を無効状態で持つAPIをデプロイする。
2. `GET /internal/system/status` が `operational` を返すことを確認する。
3. フロントエンドをCloudflare Pagesへデプロイする。
4. 通常表示、スタッフログイン、ADMIN管理画面を確認する。
5. ADMINからメンテナンスを開始する。
6. 一般ブラウザーがメンテナンス画面へ切り替わることを確認する。
7. ADMIN / EDITORが通常画面を利用できることを確認する。
8. メンテナンスを終了し、一般ブラウザーが通常画面へ戻ることを確認する。

ロールバック時は、フロントエンドを先に旧版へ戻す。新APIは通常状態であれば追加エンドポイントが残っていても旧フロントへ影響しない。

## 21. 品質確認

実装完了後は、プロジェクト規約に従って次を実行する。

```text
pnpm check:ci
pnpm typecheck
pnpm test:unit
pnpm build
```

追加の依存パッケージは不要である。SolidJS、Solid Router、Firebase、Kobalte、LucideとWeb標準APIだけで実装する。

手動確認:

- ライト・ダークテーマ
- モバイル幅、デスクトップ幅、200%ズーム
- キーボードのみの操作
- スクリーンリーダーでの見出し、フォームラベル、状態変更
- オフライン、API接続拒否、タイムアウト
- Firebaseポップアップのキャンセル、別アカウント選択
- タブ非表示・復帰
- メンテナンス中のページ再読込
- メンテナンス終了時の復帰

## 22. 受け入れ条件

- Cloudflare PagesはAPI停止中もメンテナンスまたは接続エラー画面を表示できる。
- `maintenance_mode` を受け取った一般利用者は、どの画面からでもメンテナンス画面へ切り替わる。
- `service_unavailable` や接続失敗を計画メンテナンスと誤表示しない。
- メンテナンスコメントを改行付きプレーンテキストとして安全に表示できる。
- メンテナンス中の既存ADMIN / EDITORセッションを復元できる。
- `/maintenance/login` からADMIN / EDITORがログインできる。
- 通常ログインとスタッフログインが同じフォームコンポーネントを利用する。
- PLAYERはスタッフログイン経由でアプリを開けない。
- 非公開導線のURLが知られても認可を迂回できない。
- ADMINだけが画面からメンテナンスを開始・終了できる。
- ADMINはメンテナンス開始後も管理画面を利用できる。
- EDITORはメンテナンス中も編集画面を利用できるが、状態変更はできない。
- メンテナンス終了後、一般利用者が現在URLを保ったまま通常表示へ復帰できる。
- 失敗した更新系リクエストを自動再送しない。
- 通常時の既存認証遷移とページ表示を変更しない。
- 必須のチェック、型検査、単体テスト、ビルドがすべて成功する。

## 23. 実装前に再確認する事項

- API側の最終レスポンス型と `maintenance_mode` エラーコード
- APIの `Retry-After` がCORSの `Expose-Headers` に含まれること
- Cloudflare Pages本番環境から状態確認APIへCORSアクセスできること
- 本番のCloudflare PagesがSPAの深いURLを `index.html` へフォールバックすること
- `/maintenance/login` へ直接アクセスしても404にならないこと
- APIが単一プロセスで稼働するというAPI設計上の前提

## 24. 結論

フロントエンドは、起動時の公開状態確認と、通常API通信中の `maintenance_mode` 検知を組み合わせてメンテナンス状態へ遷移する。

計画メンテナンスとAPI接続不能を別画面にし、状態を確認できない場合に誤ったメンテナンス案内を出さない。一般利用者にはアプリ全体のゲートを表示し、ADMIN / EDITORは既存Firebaseセッションまたは非公開導線ログインから通常画面を利用する。

ADMIN向け管理画面、共有ログインフォーム、中央化した状態Storeにより、各ページへ個別のメンテナンス処理を増やさず、API側の認可を正とした構成を維持する。

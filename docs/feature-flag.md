# フロントエンド feature-flag

運用環境ごとに、機能の表示・利用可否を切り替える仕組みです。設定はビルド時に確定し、変更の反映には再ビルド・再配布が必要です。現在の登録フラグは、配備設定の確認用の `feature_flag_probe` だけです（後述）。

API からのフラグ取得、ユーザー単位・割合での公開、実行中の切り替え、緊急停止スイッチは扱いません。無効な機能のコードをバンドルから除去する仕組みでもないため、隠したい情報は含めないでください。

## 運用環境の設定

必須の公開環境変数 `PUBLIC_APP_ENV` に、次のいずれかを指定します。大文字・小文字を区別し、前後の空白も許可しません。

| 値 | 用途 |
| --- | --- |
| `develop` | 開発環境 |
| `staging` | ステージング環境 |
| `production` | 本番環境 |

ローカルでは `.env.example` を参考に、gitignore 対象の `.env` に以下を設定してください。

```dotenv
PUBLIC_APP_ENV=develop
```

`rsbuild.config.mjs` で必須チェックと値の検証を行います。未設定・不正値の場合、`pnpm build` だけでなく `pnpm dev` / `pnpm start` も失敗します。`NODE_ENV` や Rsbuild のビルドモードとは別の設定であり、本番ビルドでも `PUBLIC_APP_ENV=develop` を指定できます。

ホスティング（Cloudflare Pages 等）の各環境に、配備先に対応する値を設定してからマージしてください。`develop` のまま本番成果物を作る事故は値の検証では防げません。環境ごとに明示設定し、環境別にビルドしてください。

CI は `.env.example` をコピーするため、`develop` としてのみ検証します。導入時には `staging` / `production` を指定した `pnpm build` も確認します。

## 定義と判定

`src/constants/featureFlags.ts` の `FEATURE_FLAG_DEFINITIONS` に定義します。以下は追加時の書式例です。

```typescript
export const FEATURE_FLAG_DEFINITIONS = {
  new_ranking_page: { develop: true, staging: true, production: false },
} as const satisfies Record<string, FeatureFlagDefinition>
```

- `true` の環境でだけ有効です。`false` または省略した環境では無効です。
- 未知の環境キーや boolean 以外の値は型エラーになります。
- `FeatureFlagName` は定義のキーから導出します。0件のときは `never` になり、`isFeatureEnabled` に指定できる名前はありません。
- API と同じ機能を制御する場合、API の `feature-flag.yml` と同じ snake_case 名・環境設定に揃えます。

実装は次の責務に分離しています。

| ファイル | 責務 |
| --- | --- |
| `src/constants/featureFlags.ts` | 運用環境・型・フラグ定義 |
| `src/utils/featureFlag.ts` | 環境名の検証、有効な機能名の集合を返す純粋関数 |
| `src/lib/featureFlags.ts` | 公開環境変数の取得・検証、アプリ用の一度だけの解決 |

画面からは `src/lib/featureFlags.ts` の `APP_ENVIRONMENT` / `isFeatureEnabled` を利用します。環境は実行中に変わらないため、Signal や Primitive / store は使いません。

`src/lib/featureFlags.ts` はブラウザ側からのみ import してください。constants / utils / scripts からは import せず、`src/config.ts` にも追加しません。constants / utils は環境変数なしで Node.js から利用でき、単体テストも環境変数の設定を必要としません。

## 利用ルール

フラグは「機能が見える・使えるか」だけを制御します。初期化処理や必須設定、セキュリティヘッダーの生成は分岐させません。

### 新しいページ

`src/App.tsx` のルート定義で、無効な機能のルート自体を登録しないでください。直接 URL を開いた場合は既存の NotFound 画面を表示します。SPA のため HTTP 404 を返すものではありません。

### 導線

ナビゲーションやボタンなどは、フラグを登録したうえで `<Show when={isFeatureEnabled('new_ranking_page')}>` のように隠します。動的リストは既存規約どおり `<For>` で描画します。

ツール一覧など定数配列から描画する導線では、配列要素にフラグ名を持たせ、同じ判定で filter してください。導線を隠すだけでなく、対応するルートも登録しないようにします。

### 固定 HTML 生成

現在は固定 HTML 生成対象のページにフラグを付けていないため、`scripts/generate-static-page-html.mjs` の生成対象の絞り込みは実装していません。固定 HTML 生成対象のページに初めてフラグを付ける際に、次の対応を行ってください。

- `loadEnv()` で読んだ `PUBLIC_APP_ENV` を検証し、`resolveEnabledFeatures` に明示的に渡す。
- ツール一覧と同じ判定で生成対象を絞り、無効なページのタイトル・説明・OGP を含む固定 HTML を出力しない。
- `src/lib/featureFlags.ts` は import しない。静的 import は `loadEnv()` より先に評価されるため、スクリプト側で環境を明示的に解決する。

### API と連動する機能

フロントと API の設定は別成果物であり、自動同期しません。

- 有効化は API → フロントの順に行います。
- 無効化・ロールバックは原則フロント → API の順に行います。
- 配信済み・起動中の古いフロントから無効化済み API を呼ぶと 404 が返り得ます。既存のエラー処理で扱ってください。
- フロントのフラグは表示制御のみです。認可・保護は API 側で担保します。

## 配備設定の確認用フラグ

`feature_flag_probe` は、各環境で feature-flag が意図どおりに効いているかを確かめるためのフラグです。API の同名フラグと同じく develop / staging で有効、production で無効です。

管理メニュー（`/admin`）に、運用環境（`PUBLIC_APP_ENV`）、フロントの判定、API の判定を並べて表示します。API は `GET /internal/admin/feature-flag-probe` が 200 なら ON、404（無効な環境ではルートが登録されない）なら OFF です。表示自体はフラグで隠さず、production でも両方 OFF であることを確認できます。

| 環境 | フロント | API |
| --- | --- | --- |
| develop / staging | ON | ON |
| production | OFF | OFF |

確認が済んだら、API・フロントの両方から定義・ルート・表示を削除します。

## 追加・公開・削除の手順

1. `FEATURE_FLAG_DEFINITIONS` に `{ develop: true }` で追加し、ルート・導線の判定を実装します。固定 HTML 生成対象なら、前述の絞り込みも実装します。
2. staging → production の順に `true` にし、各環境向けに再ビルド・再配布します。
3. 全環境で安定したら、定義と判定分岐を削除します。定義の削除により、残った `isFeatureEnabled('xxx')` は型エラーになり、消し忘れを検出できます。

## テスト

`src/utils/featureFlag.test.ts` で、環境ごとの有効化、false・省略時の無効化、空定義、環境名の検証を Given-When-Then 形式で確認します。

`@ts-expect-error` による型テストでは、テスト用定義の未登録名、未知の環境キー、非 boolean 値が型エラーになることを確認します。不正入力は呼び出さない関数内に置き、実行時には評価しません。

機能の判定を必要とするロジックには真偽値を引数で渡し、`isFeatureEnabled` をモックしなくてよい構造にしてください。テストでは `resolveEnabledFeatures` にテスト用定義と環境を渡し、アプリ用の `src/lib/featureFlags.ts` は import しません。

```bash
pnpm check:ci
pnpm typecheck
pnpm test:unit
pnpm build
```

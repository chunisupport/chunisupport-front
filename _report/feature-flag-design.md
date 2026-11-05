# フロントエンド feature-flag 設計

## 背景

API 側（chunisupport-api `99a8355`）に、環境ごとに機能の有効/無効を切り替える feature-flag が入った。

- `internal/config/feature-flag.yml` を `go:embed` で同梱し、`develop` / `staging` / `production` ごとに bool を指定する
- 省略した環境は `false`、未知の `APP_ENV` は全フラグ無効
- 変更の反映は再ビルド・再配布。実行中の切り替えはしない
- フロントへの公開API（フラグ一覧の配信）は対象外

フロントも同じ考え方で、未完成の画面・導線を develop / staging だけで先行公開できるようにする。

## 目標 / 非目標

目標
- 環境（develop / staging / production）ごとに機能の表示・利用可否を切り替えられる
- フラグ名を型で縛り、存在しない名前の参照や消し忘れをコンパイルエラーで検出する
- 判定ロジックは純粋関数として単体テストできる

非目標
- API からのフラグ取得（API 側が公開APIを持たないため。必要になったら別途設計）
- ユーザー単位・割合でのロールアウト、実行中の切り替え、緊急停止スイッチ
- 無効な機能のコードをバンドルから除去すること（隠したい情報は置かない前提）

## 環境の識別

フロントには現状、環境名を表す変数がない（`.env` の値で接続先を変えているだけ）。

- 公開環境変数 `PUBLIC_APP_ENV` を追加する。値は `develop` / `staging` / `production` のいずれか
- `rsbuild.config.mjs` の `REQUIRED_PUBLIC_ENV_KEYS` に追加し、未設定ならビルドを失敗させる
- 値が3種類以外ならビルドを失敗させる（API は未知の値を全無効にするが、フロントはビルド時に検出できるので早く落とす。防げるのはタイポ等の不正値のみで、`develop` のまま本番成果物を作る事故は防げない。配備先ごとに明示設定し、環境別にビルドする運用で担保する）
- 設定構造上、`pnpm dev` / `start` でも必須チェックが走る。ローカルの `.env` にも追加が必要になる旨を README / docs で周知する
- CI は `.env.example`（develop）でしか検証しない。導入時は staging / production の値でもビルドが通ることを手元で確認する
- `.env.example` は `PUBLIC_APP_ENV=develop`。CI は `.env.example` をコピーするので develop としてビルドされる
- `src/lib/env.ts` の `ENV_KEYS` と `src/env.d.ts` にも追加する
- 単体テスト実行時（`process.env` 経由）は未設定でも動くよう、判定関数は環境名を引数に取り、モジュール側の解決結果だけが env に依存する形にする

**配備時の注意**: ホスティング（Cloudflare Pages 等）の各環境に `PUBLIC_APP_ENV` を設定してからマージする必要がある。

## フラグ定義

YAML は使わず TypeScript の定数で定義する（YAML パーサ依存を増やさない、キーから型を導出できる、API の「定数・登録一覧・YAML の3か所」に相当する二重管理が不要になる）。

`src/constants/featureFlags.ts`

```ts
/** feature-flag を切り替える運用環境。 */
export const APP_ENVIRONMENTS = ['develop', 'staging', 'production'] as const
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number]

/** 環境ごとの有効/無効。省略した環境は無効。 */
export type FeatureFlagDefinition = Readonly<Partial<Record<AppEnvironment, boolean>>>

/**
 * 機能ごとの環境別有効/無効の定義。
 * API 側と同じ機能を制御する場合は、API の feature-flag.yml と同じ名前（snake_case）を使う。
 */
export const FEATURE_FLAG_DEFINITIONS = {
  // 書式例:
  // new_ranking_page: { develop: true, staging: true, production: false },
} as const satisfies Record<string, FeatureFlagDefinition>

export type FeatureFlagName = keyof typeof FEATURE_FLAG_DEFINITIONS
```

- 現時点の登録フラグは0件。0件のとき `FeatureFlagName` は `never` になり、`isFeatureEnabled` を呼ぶ箇所が存在しないことが型で保証される
- `satisfies` によって未知の環境キーや非 bool 値は型エラーになる（API の YAML 検証に相当）

## 判定ロジック

TSDoc は規約どおり `@param` / `@returns`（必要に応じて `@typeParam` / `@throws`）まで付ける。

`src/utils/featureFlag.ts`（純粋関数）

```ts
/** 文字列が運用環境名かを判定する。 */
export const isAppEnvironment = (value: string | undefined): value is AppEnvironment

/** 定義と環境から、有効な機能名の集合を作る。 */
export const resolveEnabledFeatures = <Name extends string>(
  definitions: Readonly<Record<Name, FeatureFlagDefinition>>,
  environment: AppEnvironment,
): ReadonlySet<Name>
```

環境依存の解決は `src/lib/featureFlags.ts` に隔離し、アプリ用に1回だけ解決する。`src/config.ts` には追加しない（`src/config.ts` に依存する既存テストは `process.env` を個別設定して読み込んでおり、`PUBLIC_APP_ENV` の必須化でモジュール評価時に例外になるため）。

- `src/constants/featureFlags.ts` と `src/utils/featureFlag.ts` は環境に依存せず、Node（ビルド後スクリプト・単体テスト）からも安全に import できる状態を保つ
- `src/lib/featureFlags.ts` は画面（ブラウザ）側からのみ import する。constants / utils / scripts からは import しない

```ts
/** 現在のビルドの運用環境。 */
export const APP_ENVIRONMENT: AppEnvironment  // getRequiredEnv('PUBLIC_APP_ENV') を isAppEnvironment で検証。不正なら throw

const enabledFeatures = resolveEnabledFeatures(FEATURE_FLAG_DEFINITIONS, APP_ENVIRONMENT)

/** 現在の環境で機能が有効かを返す。 */
export const isFeatureEnabled = (name: FeatureFlagName): boolean => enabledFeatures.has(name)
```

- フラグは実行中に変わらないので Signal にはしない。Solid のリアクティビティ不要の同期関数で十分
- 状態を持たないため Primitive / store にはしない

## 利用ルール

- フラグで制御するのは「機能が見える・使えるか」だけ。初期化処理や必須設定は変えない
- **新しいページ**: `App.tsx` のルート定義で、無効時はルート自体を登録しない（直接URLで開くと既存の NotFound 画面を表示する。SPA のため HTTP 404 ではなく、画面上の振る舞いを API に揃える）
- **固定 HTML 生成**: 無効なツール・ページの固定 HTML（タイトル・説明・OGP）を出力しない。`scripts/generate-static-page-html.mjs` は `loadEnv()` で読んだ `PUBLIC_APP_ENV` を `resolveEnabledFeatures` に明示的に渡し、ツール一覧と同じ判定で生成対象を絞る。`src/lib/featureFlags.ts` は使わない（スクリプトでは静的 import が `loadEnv()` より先に評価されるため）。固定 HTML 生成対象のページに初めてフラグを付けるときに実装する
- セキュリティヘッダー生成はフラグで分岐させない
- **導線**（ナビゲーション、ツール一覧、ボタン等）: `<Show when={isFeatureEnabled('xxx')}>` で隠す。ツール一覧のように定数配列から描画しているものは、配列の要素にフラグ名を持たせて filter する
- **API の feature-flag と連動する機能**: フロントのフラグも同名で追加し、API と同じ環境に揃える。自動同期ではなく別成果物の設定である
  - 有効化は API → フロント、無効化・ロールバックは原則フロント → API の順
  - 配信済み・起動中の古いフロントから無効化済み API を呼ぶと 404 が返り得る。既存のエラー処理で扱う
  - フロントのフラグは表示制御のみ。認可・保護は API 側で担保する
- テストでは `resolveEnabledFeatures` にテスト用の定義と環境を渡す。`isFeatureEnabled` 自体はモック不要な構造を保つ（判定を必要とするロジックは、真偽値を引数で受け取る形にする）

## 追加・リリース・削除の手順

1. `FEATURE_FLAG_DEFINITIONS` に `{ develop: true }` で追加し、判定箇所を実装
2. staging → production の順に `true` にし、再ビルド・再配布
3. 全環境で安定したら定義と判定分岐を削除（定義を消すと残った `isFeatureEnabled('xxx')` が型エラーになるので消し忘れを検出できる）

## ドキュメント

- `docs/feature-flag.md` を新設し、上記の環境変数・定義・利用ルール・手順を記載
- README のセットアップ／環境変数の記述に `PUBLIC_APP_ENV` を追記

## テスト

`src/utils/featureFlag.test.ts`（Given-When-Then）
- 指定環境で `true` の機能だけが集合に入る
- 省略した環境・`false` の環境は無効
- 定義0件なら空集合
- `isAppEnvironment` が3種類だけを受け付け、`undefined`・大文字違い・空文字を拒否する
- 型テスト（`@ts-expect-error` を使い `pnpm typecheck` で検証）: テスト用定義に対する未登録名の参照、未知の環境キー、非 boolean 値が型エラーになる。定義は `satisfies` の余剰プロパティ検査が効くよう、直接オブジェクトリテラルで記述する。不正入力を使う型テストは呼び出さない関数の本体に置き、実行時には評価しない。アプリ用 `src/lib/featureFlags.ts` は import しない

## 変更ファイル一覧（予定）

- `src/constants/featureFlags.ts`（新規）
- `src/utils/featureFlag.ts` / `featureFlag.test.ts`（新規）
- `src/lib/featureFlags.ts`（新規。`APP_ENVIRONMENT`, `isFeatureEnabled`）
- `src/lib/env.ts`, `src/env.d.ts`, `.env.example`, `rsbuild.config.mjs`（`PUBLIC_APP_ENV` の追加と値検証）
- `docs/feature-flag.md`（新規）, `README.md`

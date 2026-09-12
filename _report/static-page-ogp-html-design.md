# 固定ページ向け OGP HTML 生成設計

## 1. 目的

Solid.js SPA としての動作を維持しながら、URL と表示内容が固定されている公開ページについて、ページ固有のメタ情報を含む初期 HTML をビルド時に生成する。

生成した HTML により、JavaScript を実行しない SNS、チャットサービス、検索エンジン等のクローラーも、対象ページのタイトル、説明、OGP 画像を取得できるようにする。

## 2. 前提

- フロントエンドは Rsbuild でビルドする Solid.js SPA である。
- クライアント側ルーティングには Solid Router を使用する。
- ビルド成果物は Cloudflare Pages から静的配信する。
- SPA 本体の JavaScript、CSS、ルーティング構成は変更しない。
- ページごとに別のアプリケーション entry やレンダリング処理を作らない。
- 楽曲、ユーザー、入力結果など、実行時データに依存する OGP は扱わない。

## 3. 対象範囲

### 3.1 生成対象

初期実装では次の固定ページを対象とする。

| パス | ページ |
| --- | --- |
| `/` | トップページ |
| `/songs` | 楽曲一覧 |
| `/songs/worldsend` | WORLD'S END 楽曲一覧 |
| `/tools` | ツール一覧 |
| `/tools/chart-constant-calculator` | 譜面定数計算機 |
| `/tools/border-calculator` | ボーダー計算機 |
| `/tools/weak-chart-inspector` | 苦手譜面インスペクター |
| `/tools/random-song-selector` | ランダム選曲 |
| `/tools/best-slot-ranking` | ベスト枠ランキング |
| `/tools/all-song-best-frame` | 全曲ベスト枠 |
| `/tools/rating-theoretical-checker` | ベスト枠・新曲枠理論値チェッカー |
| `/tools/dashboard` | ダッシュボード |

認証必須のツールページも上表に含める。クローラーには機能の固定された概要を提示し、人間がアクセスした場合の認証判定は既存の認証 guard に委ねる。

### 3.2 対象外

- `/songs/:displayid` など、楽曲データに依存するページ
- `/users/:username` など、ユーザーデータに依存するページ
- 譜面詳細、スコア履歴、計算結果、フィルター状態などに応じた OGP
- ログイン、新規登録、設定、管理、編集、メンテナンス用ページ
- OGP 画像の動的生成
- SSR、SSG フレームワーク、Cloudflare Workers の導入

対象外ページは従来どおり Cloudflare Pages の SPA フォールバックで `dist/index.html` を受け取り、Solid Router が表示内容を決定する。

## 4. 設計方針

### 4.1 全体構成

Rsbuild が生成した `dist/index.html` と固定ページメタ情報を固定ページ HTML 生成スクリプトへ渡し、次の成果物を用意する。

| 成果物 | 用途 |
| --- | --- |
| `dist/index.html` | 生成元のまま維持する、OGP なしの SPA フォールバック |
| `dist/root-ogp.html` | トップページ `/` 専用の OGP を含む HTML |
| `dist/songs.html` | 楽曲一覧用 HTML（追加予定） |
| `dist/songs/worldsend.html` | WORLD'S END 楽曲一覧用 HTML（追加予定） |
| `dist/tools.html` | ツール一覧用 HTML |
| `dist/tools/*.html` | 各ツール用 HTML |

Rsbuild の通常ビルド後に、`dist/index.html` をテンプレートとして固定ページ用 HTML を生成する。各 HTML では head 内のメタ情報だけを変更し、Rsbuild が生成した script、stylesheet、preload、favicon 等のタグはそのまま維持する。

### 4.2 複数 entry を使用しない理由

Rsbuild では複数 entry と entry ごとの HTML 設定も利用できるが、同じ SPA entry を固定ルート数だけ定義すると、entry chunk とビルド設定が増加する。

本設計では画面ごとの初期 DOM を生成する必要がなく、同じ SPA アセットを再利用できればよい。そのため、単一 entry のビルド成果物を複製する後処理方式を採用する。

### 4.3 `.html` ファイルとして出力する理由

Cloudflare Pages は拡張子を省略した URL と `.html` ファイルを対応させる。そのため、既存の末尾スラッシュなしのルートを維持するには、次の形式で出力する。

| ページパス | 出力先 |
| --- | --- |
| `/` | `dist/root-ogp.html` |
| `/songs` | `dist/songs.html` |
| `/songs/worldsend` | `dist/songs/worldsend.html` |
| `/tools` | `dist/tools.html` |
| `/tools/dashboard` | `dist/tools/dashboard.html` |

`dist/songs/index.html` のような形式は `/songs/` を表すため、固定ページでは使用しない。これにより、現在のルート定数、内部リンク、OGP URL を末尾スラッシュなしで統一する。

同名の HTML ファイルとディレクトリは共存できるため、`dist/tools.html` と `dist/tools/*.html` の両方を生成できる。

トップページだけは `dist/root-ogp.html` へ出力し、`dist/index.html` を上書きしない。これにより、専用 HTML がないページへ SPA フォールバックでトップページの OGP や canonical を返すことを防ぐ。`/` への配信方法は 9.1 に記載する。

## 5. 固定ページメタ情報

### 5.1 データ構造

固定ページの定義は、ブラウザーコードとビルドスクリプトの両方から参照できる TypeScript ファイルへ集約する。

```typescript
export type StaticPageMetadata = {
  path: string
  title: string
  description: string
}

export const STATIC_PAGE_METADATA: readonly StaticPageMetadata[] = [
  // 固定ページ定義
]
```

ファイル候補:

```text
src/constants/staticPageMetadata.ts
```

プロパティの責務は次のとおりとする。

| プロパティ | 内容 |
| --- | --- |
| `path` | 先頭 `/` を含み、末尾 `/` を含まないアプリ内パス |
| `title` | サイト名を含まないページ固有タイトル |
| `description` | ページの用途を簡潔に表す固定説明文 |

`og:url` と `og:image` の絶対 URL、サイト名、カード種別など、全ページ共通の値は固定ページごとの定義へ持たせない。

### 5.2 ツール定義の再利用

各ツールページの `path`、`title`、`description` は `src/constants/tools.ts` の `TOOL_LINKS` から生成する。

```typescript
const toolPageMetadata = TOOL_LINKS.filter(
  (tool) => tool.disabled !== true
).map(({ href, title, description }) => ({
  path: href,
  title,
  description,
}))
```

これにより、ツール一覧カードと OGP 定義の間に新しい二重管理を作らない。将来ツールを追加した際も、公開済みの有効な `TOOL_LINKS` であれば固定 HTML の生成対象へ追加できる。

自動追加が意図しない公開につながらないよう、`TOOL_LINKS` に OGP 生成可否を表す明示的な値を追加する方法も考えられる。ただし初期実装では全ツールが対象であるため追加しない。対象外ツールが生じた時点で `generateStaticMetadata` 等の明示的なフラグを追加する。

### 5.3 ページ名の共有

固定ページのタイトル文字列は、可能な範囲で画面上の見出しと `useDocumentTitle` でも同じ定数を参照する。

サイト名とタイトルの結合規則は共通化する。

```typescript
export const SITE_NAME = 'ChuniSupport'

export const buildDocumentTitle = (pageTitle?: string): string =>
  pageTitle ? `${pageTitle} | ${SITE_NAME}` : SITE_NAME
```

ファイル候補:

```text
src/constants/site.ts
```

`useDocumentTitle` と固定 HTML 生成処理が `buildDocumentTitle` を共有し、クライアント遷移後と初期 HTML でタイトル形式が変わらないようにする。

### 5.4 説明文

ツールページは既存の `TOOL_LINKS.description` を利用する。その他の固定ページには次の文言を使用する。

| パス | 説明文 |
| --- | --- |
| `/` | CHUNITHM のプレイデータ管理と分析を支援する Web サービスです。 |
| `/songs` | CHUNITHM の楽曲と通常譜面の情報を検索、確認できます。 |
| `/songs/worldsend` | CHUNITHM の WORLD'S END 楽曲と譜面情報を検索、確認できます。 |
| `/tools` | CHUNITHM のプレイや目標設定に役立つ計算・分析ツールを利用できます。 |

## 6. 出力するメタ情報

各固定ページの初期 HTML には少なくとも次の要素を含める。

```html
<title>ページ名 | ChuniSupport</title>
<meta name="description" content="ページの説明">
<link rel="canonical" href="https://chunisupport.net/page-path">
<meta property="og:site_name" content="ChuniSupport">
<meta property="og:title" content="ページ名 | ChuniSupport">
<meta property="og:description" content="ページの説明">
<meta property="og:url" content="https://chunisupport.net/page-path">
<meta property="og:image" content="https://chunisupport.net/ogp/default.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="ページ名 | ChuniSupport">
<meta name="twitter:description" content="ページの説明">
<meta name="twitter:image" content="https://chunisupport.net/ogp/default.png">
```

`twitter:title`、`twitter:description`、`twitter:image` は OGP からのフォールバックも可能だが、サービス間の解釈差を小さくするため明示する。

### 6.1 URL

- サイトのベース URL は `PUBLIC_FRONTEND_URL` から取得する。
- 環境変数末尾の `/` の有無に依存せず、`new URL(path, baseUrl)` で絶対 URL を生成する。
- ページパスにはクエリ文字列やフラグメントを含めない。
- `canonical` と `og:url` には同じ URL を使用する。
- OGP 画像も絶対 URL に変換する。

### 6.2 OGP 画像

全固定ページで共通画像を使用する。

```text
public/ogp/default.png
```

推奨仕様:

- PNG または JPEG
- 1200 × 630 px
- ChuniSupport のサービス名を画像内に含める
- 端から重要要素まで十分な余白を確保する
- 小さなカード表示でも判読可能な構成にする

既存の PWA アイコンは正方形であり、`summary_large_image` の表示比率に適さないため使用しない。

## 7. HTML 生成処理

### 7.1 ファイル構成

```text
scripts/generate-static-page-html.ts
scripts/staticPageHtml.ts
scripts/staticPageHtml.test.ts
```

責務を次のように分ける。

| ファイル | 責務 |
| --- | --- |
| `generate-static-page-html.ts` | 環境変数読込、入出力、ディレクトリ作成、全ページ生成 |
| `staticPageHtml.ts` | 出力パス計算、HTML エスケープ、メタタグ生成、head 置換 |
| `staticPageHtml.test.ts` | 純粋関数と生成結果の単体テスト |

### 7.2 処理手順

1. Rsbuild の通常ビルドを完了させる。
2. `dist/index.html` を UTF-8 で一度だけ読み込む。
3. `PUBLIC_FRONTEND_URL` を読み込んで妥当な絶対 URL か検証する。
4. 固定ページ定義のパス重複と形式を検証する。
5. 各ページについてタイトルとメタタグを生成する。
6. 元 HTML の `<title>` を置換する。
7. `</head>` の直前へ固定ページ用タグを挿入する。
8. ページパスに対応した `.html` ファイルへ UTF-8、BOM なしで書き込む。
9. `/` の生成結果は `dist/root-ogp.html` へ書き込み、`dist/index.html` は OGP なしの SPA フォールバックとして維持する。

すべてのページは同じ `dist/index.html` を基に生成する。固定ページ HTML 生成処理はこのファイルを変更せず、生成済みのページ HTML を次ページのテンプレートに使用しない。

### 7.3 HTML 操作

入力は Rsbuild が管理する既知の HTML であるため、HTML パーサー依存は追加せず、次の限定された置換だけを行う。

- `<title>...</title>` を1箇所置換する。
- `</head>` を1箇所検出して、その直前へ生成タグを挿入する。

次の場合は不完全な成果物を出力せず、ビルドを失敗させる。

- `dist/index.html` が存在しない。
- `<title>` または `</head>` が存在しない。
- `<title>` または `</head>` が複数あり、置換対象を一意に決定できない。
- 固定ページ定義のパスが重複している。
- パスが `/` で始まらない、末尾 `/` を含む、クエリやフラグメントを含む。
- 出力先が `dist` の外側になる。
- `PUBLIC_FRONTEND_URL` が絶対 HTTP(S) URL ではない。

タイトルと属性値には `&`、`<`、`>`、`"`、`'` の HTML エスケープを適用する。

### 7.4 既存タグの保持

生成スクリプトは次の内容を変更しない。

- script の URL、属性、順序
- stylesheet、preload、preconnect
- favicon、Web App Manifest、Apple Touch Icon
- viewport、charset、theme-color
- `robots`

`PUBLIC_ENABLE_INDEXING=false` のビルドでは、Rsbuild が生成した `robots=noindex` をすべての固定ページ HTML に保持する。固定ページ生成処理から `robots` を上書きしない。

## 8. ビルドへの組み込み

`package.json` の `build` を次の構成にする。

```json
{
  "scripts": {
    "build": "rsbuild build && node --import ./scripts/register-ts-extension-loader.mjs scripts/generate-static-page-html.ts"
  }
}
```

生成スクリプトは Rsbuild 成功時だけ実行する。生成に失敗した場合は非ゼロ終了し、固定 HTML が不足した状態でデプロイされないようにする。

Node.js から TypeScript 定義を読み込む際は、既存の TypeScript 拡張子解決 loader を再利用する。新しいトランスパイラーや実行環境依存は追加しない。

## 9. SPA と配信への影響

### 9.1 直接アクセス

トップページ `/` には、`public/_redirects` の次の設定で `dist/root-ogp.html` を配信する。Rsbuild はこの設定ファイルを `dist/_redirects` へコピーする。

```plain
/ /root-ogp 200
/root-ogp / 301
```

1行目は Cloudflare Pages 内部で配信する HTML を切り替えるため、ブラウザーの URL は `/` のままとなる。2行目は `/root-ogp` への直接アクセスを `/` へリダイレクトする。トップページ HTML の `canonical` と `og:url` には公開サイトの `/` を指定し、内部配信用パス `/root-ogp` は使用しない。

`/tools/border-calculator` へ直接アクセスした場合、Cloudflare Pages は `dist/tools/border-calculator.html` を返す。HTML に含まれる既存の SPA entry が起動し、Solid Router は現在の URL から従来のツール画面を表示する。

### 9.2 SPA 内遷移

Solid Router によるクライアント遷移では HTML の再取得は発生しない。各画面の `useDocumentTitle` が引き続き document title を更新する。

初期 HTML の OGP タグをクライアント遷移ごとに書き換える必要はない。OGP クローラーは共有された URL へ直接アクセスし、その URL に対応する固定 HTML を取得するためである。

### 9.3 動的ルート

`/songs/example-id` に対応する静的ファイルが存在しない場合、Cloudflare Pages の SPA フォールバックにより OGP なしの `dist/index.html` が返る。`/` 専用の内部配信設定を未生成のパスへ適用せず、トップページの OGP や canonical を含めない。Solid Router は従来どおり楽曲詳細ルートを表示する。

Cloudflare Pages の SPA フォールバックはトップレベルの `404.html` がない構成を前提とする。将来 `404.html` を追加する場合は、動的ルートの配信方法をあわせて再設計する。

## 10. 将来の動的 OGP 生成との共存

固定ページ生成は、楽曲データ等を取得しない。将来、楽曲別 HTML を生成する場合も次のように出力先が分離される。

```text
dist/songs.html                    固定の楽曲一覧
dist/songs/worldsend.html          固定の WORLD'S END 一覧
dist/songs/:displayid/index.html   将来の楽曲別 HTML
```

複数の生成処理を導入する場合は、互いの出力先が重複しないことをビルド時に検証する。共通の HTML エスケープ、メタタグ生成、タイトル生成処理は同じ helper へ集約する。

## 11. テスト設計

### 11.1 単体テスト

Given-When-Then 形式で少なくとも次を確認する。

#### 出力先

- `/` が `dist/root-ogp.html` になる。
- `/songs` が `dist/songs.html` になる。
- `/tools/dashboard` が `dist/tools/dashboard.html` になる。
- 末尾 `/`、`..`、クエリ、フラグメントを含むパスを拒否する。

#### HTML 生成

- `<title>` がページ固有タイトルへ置換される。
- 必須の OGP、Twitter Card、description、canonical が追加される。
- 日本語、`&`、引用符、山括弧が安全にエスケープされる。
- 元の script と stylesheet タグが同一のまま残る。
- 元の `robots` タグが残る。
- 元 HTML をページ間で使い回してもメタタグが重複しない。
- `<title>` または `</head>` がない入力を拒否する。

#### 定義

- 固定ページのパスが重複していない。
- 対象ツールの全パスが含まれる。
- disabled なツールを生成対象に含めない。
- タイトルと説明文が空ではない。

### 11.2 ビルド成果物の確認

`pnpm build` 後に次を確認する。

- 対象パスに対応する全 `.html` が生成されている。
- 生成した各固定ページ HTML に正しい絶対 `og:url` が含まれる。
- `dist/root-ogp.html` の `og:url` と canonical が公開サイトの `/` を指す。
- 固定ページ HTML 生成前後で `dist/index.html` が変わらず、OGP と canonical を含まない。
- `dist/_redirects` に 9.1 の設定が含まれる。
- `og:image` が存在する公開ファイルを指している。
- 全 HTML の script、stylesheet URL が `dist/index.html` と一致する。
- JavaScript を実行せずに HTML を取得してもページ固有メタ情報が読める。
- Cloudflare Pages 上で `/` へ直接アクセスすると、URL を変えずにトップページ固有のメタ情報を含む HTML を返す。
- `/root-ogp` へ直接アクセスすると `/` へリダイレクトする。
- 未生成の動的ルートが Cloudflare Pages 上で引き続き SPA として表示でき、初期 HTML にトップページの OGP や canonical を含まない。

## 12. 品質確認

実装後は次を実行する。

```text
pnpm check:ci
pnpm typecheck
pnpm build
pnpm test:unit
```

あわせて次をセルフレビューする。

- 新規・変更関数に目的、引数、返り値を説明する TSDoc がある。
- Node.js 用処理がブラウザー bundle に含まれていない。
- 画面用定数からビルドスクリプトへの不正な feature 間依存がない。
- HTML と TypeScript ファイルが UTF-8、BOM なしで保存されている。
- 既存の SPA route と固定ページ定義のパスが一致している。
- 一時的な確認ファイルが残っていない。

## 13. 変更対象

### 13.1 新規追加候補

```text
public/ogp/default.png
src/constants/site.ts
src/constants/staticPageMetadata.ts
scripts/generate-static-page-html.ts
scripts/staticPageHtml.ts
scripts/staticPageHtml.test.ts
```

### 13.2 変更候補

```text
public/_redirects
package.json
tsconfig.json
src/App.tsx
src/constants/routes.ts
src/constants/tools.ts
src/hooks/useDocumentTitle.ts
src/pages/songs/SongsList/SongsList.tsx
src/pages/songs/WorldsendSongsList/WorldsendSongsList.tsx
```

ツール個別ページは、既存のタイトル・説明定数を `TOOL_LINKS` と共通化する範囲に応じて変更する。固定 HTML 生成だけを目的とした大規模な文言定数の移動は行わず、文字列リテラルの新規重複を増やさないことを優先する。

## 14. 完了条件

- 対象 URL の初期 HTML にページ固有の title、description、OGP、Twitter Card が含まれる。
- JavaScript を実行しないクローラーがメタ情報を取得できる。
- 全固定ページが同じ SPA JavaScript/CSS 成果物を利用する。
- 直接アクセスと Solid Router による SPA 遷移の両方が動作する。
- トップページ `/` は URL を変えずに `dist/root-ogp.html` を配信する。
- 未生成の動的ルートに対する SPA フォールバックには OGP なしの `dist/index.html` を使用し、トップページの OGP や canonical を返さない。
- 固定ページ追加時は、共通定義へメタ情報を追加するだけで生成対象を拡張できる。
- ツール名と説明文について `TOOL_LINKS` との新たな二重管理がない。
- 開発・検証環境の `robots=noindex` が固定 HTML にも保持される。
- 必須チェック、型検査、ビルド、単体テストがすべて成功する。

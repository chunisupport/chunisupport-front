# OGP対応設計: 楽曲ページ静的生成とユーザーページ共有URL

## 1. 目的

ChuniSupport の通常URLと Cloudflare Pages による静的配信を維持しつつ、OGP を導入する。
Workers Free のリクエスト枠を通常閲覧で消費しないことを優先し、ページ種別ごとに方式を分ける。

- 楽曲ページは Cloudflare Pages 上に楽曲別HTMLを静的生成する。
- ユーザーページは通常URLを変更せず、明示的な共有操作だけ `share.chunisupport.net` の共有URLを生成する。
- ユーザー共有URLは Cloudflare Workers で処理する。
- 通常の `chunisupport.net` 配信は引き続き Cloudflare Pages が担当する。
- OGP のためだけに Workers Paid や Cloudflare Pro へ移行しない。

## 2. 背景と制約

現在のフロントエンドは Solid.js + Rsbuild のSPAであり、Cloudflare Pages から配信している。
`/songs/:displayid` や `/users/:username` は Solid Router がクライアント側で解決するため、通常はルート `index.html` が返る。

OGPクローラーはクライアント側JavaScriptによる `<meta>` の書き換えを前提にできないため、ページ固有のOGPには初回HTMLレスポンス側でメタ情報を含める必要がある。

一方で、全アクセスをWorkerやVPSへ通すと以下の問題がある。

- Workers Free の 100,000 request/day を通常閲覧でも消費する。
- Workers Paid は最低月額料金が発生する。
- VPSへ静的ファイル配信を移すと Cloudflare Pages 採用の利点が薄れる。

そのため、OGPの必要性とデータ更新特性に応じて方式を分ける。

## 3. 決定事項

### 3.1 楽曲ページ

通常URLをそのまま利用する。

```text
https://chunisupport.net/songs/:displayid
```

Rsbuild の通常ビルド後に、全楽曲について次のファイルを生成する。

```text
dist/songs/:displayid/index.html
```

各ファイルは `dist/index.html` を基にし、楽曲固有の `<title>` と OGP/Twitter Card メタタグだけを差し替える。
アプリ本体のJavaScript、CSS、ルーティング、楽曲詳細画面は従来どおりとする。

### 3.2 ユーザーページ

通常閲覧URLは変更しない。

```text
https://chunisupport.net/users/:username
```

ユーザーが共有操作を実行した場合だけ、次のURLを共有する。

```text
https://share.chunisupport.net/users/:username
```

`share.chunisupport.net` は Cloudflare Worker の Custom Domain とし、Worker が公開プロフィール情報を取得してOGP付きHTMLを返す。
人間が共有URLを開いた場合は通常のユーザーページへ遷移する。

### 3.3 Workers の利用範囲

Worker は `share.chunisupport.net` だけで利用する。
`chunisupport.net` の通常アクセスには Worker Route を設定しない。

これにより、Workers Free のリクエスト枠を消費するのは共有URLへのアクセスだけとなる。

## 4. 全体構成

```text
                         Cloudflare
                             │
              ┌──────────────┴──────────────┐
              │                             │
      chunisupport.net              share.chunisupport.net
              │                             │
      Cloudflare Pages              Cloudflare Worker
              │                             │
   ┌──────────┴──────────┐                  │
   │                     │                  ▼
通常SPA HTML      楽曲別静的HTML       chunisupport-api
   │                     │                  │
   └──────────┬──────────┘                  │
              ▼                             │
          Solid.js SPA                      │
                                            ▼
                              OGP付き共有HTMLを返す
                                            │
                                            ▼
                              /users/:username へ遷移
```

## 5. 楽曲ページ静的生成

### 5.1 生成対象

初期実装では通常楽曲詳細だけを対象とする。

```text
/songs/:displayid
```

WORLD'S END 詳細も同じ方式で対応可能だが、初期実装へ含めるかは実装時に判断する。

譜面詳細、スコア履歴、管理画面などは対象外とする。

### 5.2 生成タイミング

`pnpm build` の Rsbuild ビルド完了後に生成スクリプトを実行する。

```text
rsbuild build
    ↓
scripts/generate-song-ogp-pages.mjs
    ↓
dist/songs/:displayid/index.html
```

`package.json` は概ね次の構成とする。

```json
{
  "scripts": {
    "build": "rsbuild build && node scripts/generate-song-ogp-pages.mjs"
  }
}
```

生成スクリプトはブラウザ用の `src/api/songs.ts` を直接利用しない。
Node.js の `fetch()` で公開GET APIを直接呼び、ビルド処理をブラウザ側の認証・キャッシュ実装から分離する。

### 5.3 データ取得

生成スクリプトは環境変数の `PUBLIC_BACKEND_URL` を利用し、全楽曲一覧を取得する。

```text
GET {PUBLIC_BACKEND_URL}/internal/songs
```

取得する主な情報は以下とする。

- `id`
- `title`
- `artist`
- `jacket`
- OGP説明文に必要な譜面情報

OGP生成だけのために新しいAPIを追加しない。
既存レスポンスが過大となる、または必要情報が不足する場合だけ専用エンドポイントを検討する。

### 5.4 出力HTML

生成スクリプトは Rsbuild が生成した `dist/index.html` をテンプレートとして利用する。

例:

```html
<title>SONG TITLE - ChuniSupport</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="ChuniSupport">
<meta property="og:title" content="SONG TITLE - ChuniSupport">
<meta property="og:description" content="ARTIST / CHUNITHM楽曲情報">
<meta property="og:url" content="https://chunisupport.net/songs/DISPLAY_ID">
<meta property="og:image" content="JACKET_OR_OGP_IMAGE_URL">
<meta name="twitter:card" content="summary_large_image">
```

OGPメタタグ以外は元の `index.html` を保持する。
これにより、生成HTMLから従来と同じSolid.jsアプリが起動する。

### 5.5 URL生成

出力先は現在のルート生成規則と合わせる。

```text
dist/songs/${encodeURIComponent(displayId)}/index.html
```

ただしファイルシステム上の名前として `%2F` などを含む値は扱いに注意する。
現在の `displayId` の許容文字を確認し、必要なら生成スクリプト側で不正値を拒否する。

### 5.6 OGP画像

初期実装では既存のジャケット画像URLを `og:image` として利用できる。

将来的に 1200 x 630 の専用画像を用意する場合も、HTML静的生成の方式は変更しない。
生成済み画像のURLを `og:image` に設定するだけとする。

OGP対応の初期段階では画像合成を必須としない。

### 5.7 新規・更新楽曲への追従

静的生成では、APIへ新曲が反映されても既存のPagesデプロイにはHTMLが存在しない。
この期間でもSPAフォールバックにより通常画面は利用できるが、個別OGPは存在しない。

この差を短縮するため、API側の楽曲更新処理で変更を検出した場合に Cloudflare Pages Deploy Hook を呼ぶ方式を推奨する。

```text
song batch / 楽曲編集
        ↓
楽曲データ変更
        ↓
Pages Deploy Hook
        ↓
front build
        ↓
最新楽曲一覧を取得
        ↓
楽曲別HTML生成
```

Deploy Hook はデータに変更がなかった場合は呼ばない。
同一バッチ内で複数曲が変更された場合も1回だけ呼ぶ。

API側から直接Deploy Hookを呼ぶことを避けたい場合は、既存のデプロイ基盤から更新日時を確認して再デプロイする方式でもよい。

### 5.8 ビルド失敗時

楽曲一覧APIの取得に失敗した場合、OGP生成を黙って省略して成功扱いにしない。
本番向けビルドではビルド自体を失敗させる。

理由は、成功扱いにすると既存の楽曲別HTMLが新デプロイで消え、OGPが一斉に失われる可能性があるためである。

必要ならローカル開発だけスキップできる明示的な環境変数を追加する。

### 5.9 HTMLエスケープ

`title`、`artist` などAPI由来の文字列をHTMLへ直接連結しない。
`&`, `<`, `>`, `"`, `'` を適切にエスケープする。

OGP値は属性値として埋め込むため、XSSだけでなく壊れたHTMLを生成しないことを重視する。

### 5.10 テスト

生成ロジックは可能な範囲で純粋関数へ分離する。

最低限、以下を単体テストする。

- 通常の楽曲情報から正しいメタタグを生成できる。
- 日本語、記号、`&`、引用符を含む曲名を安全に出力できる。
- `displayId` に応じた正しい出力パスを生成できる。
- ジャケットがない場合に既定画像へフォールバックする。
- API取得失敗時にビルドを失敗させる。

## 6. ユーザーページ共有URL

### 6.1 対象

共有URLはユーザーページだけを対象とする。

```text
通常URL:
https://chunisupport.net/users/:username

共有URL:
https://share.chunisupport.net/users/:username
```

楽曲ページには共有専用URLを導入しない。
楽曲URLはコピーやSNS投稿で直接利用されることを前提とする。

### 6.2 front側仕様

UserPage に共有操作を追加する。

共有URLは共通関数で生成する。

```ts
buildUserShareUrl(username)
```

概念例:

```ts
const url = `https://share.chunisupport.net/users/${encodeURIComponent(username)}`
```

ブラウザが Web Share API に対応している場合は `navigator.share()` を利用する。
既存の画像共有処理と共通化できる範囲は共通化するが、単純なURL生成まで過剰に抽象化しない。

Web Share API が利用できない環境では共有URLをクリップボードへコピーする。

### 6.3 公開範囲

初期実装では公開プロフィールだけを共有対象とする。

非公開プロフィールを共有するための一時トークン、署名付きURL、閲覧権限の一時解除などは実装しない。

共有ボタンを表示する条件は、既存のプロフィール公開設定と一致させる。
front側だけの判定をセキュリティ境界にはせず、Workerから匿名アクセスしたAPIが非公開情報を返さないことを前提とする。

### 6.4 Workerの責務

Workerは以下だけを担当する。

1. `/users/:username` のルートを解釈する。
2. ChuniSupport APIから公開プロフィール情報を取得する。
3. OGP付きHTMLを生成する。
4. 通常プロフィールURLへの遷移手段をHTMLへ含める。

Worker内で以下は行わない。

- Firebase認証
- DBへの直接アクセス
- R2/KV/D1へのプロフィール保存
- 画像合成
- 通常のChuniSupport SPA配信

### 6.5 APIアクセス

初期実装では既存APIを利用する。

```text
GET /internal/users/:username/profile
GET /internal/users/:username/rating
```

OGPに必要な情報が `profile` だけで足りる場合は1リクエストとする。
レーティング表示が必要な場合だけ `rating` も取得する。

WorkerからのAPIアクセスは匿名アクセスとして扱う。
APIの既存プライバシー制御を迂回しない。

将来的にOGPに必要な情報が増えて複数リクエストが問題となった場合だけ、専用の公開共有APIを検討する。

### 6.6 Workerレスポンス

正常時はHTMLを返す。

```html
<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>USERNAME - ChuniSupport</title>
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="ChuniSupport">
  <meta property="og:title" content="USERNAME - ChuniSupport">
  <meta property="og:description" content="RATING ...">
  <meta property="og:image" content="DEFAULT_OR_USER_OGP_IMAGE">
  <meta property="og:url" content="https://share.chunisupport.net/users/USERNAME">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://chunisupport.net/users/USERNAME">
</head>
<body>
  <p><a href="https://chunisupport.net/users/USERNAME">ChuniSupportで開く</a></p>
  <script>location.replace("https://chunisupport.net/users/USERNAME")</script>
</body>
</html>
```

JavaScriptを実行しないクライアントでも通常URLへ移動できるよう、リンクを必ず含める。

### 6.7 エラー時

APIの状態に応じて次のように扱う。

- ユーザーが存在しない: `404`
- 非公開で匿名取得できない: APIの意味に合わせて `404` または `403`
- API障害: `502` または `503`
- Worker内の不正パス: `404`

APIエラー時に架空のプロフィール情報を生成しない。

一時的なAPI障害時に古い個人データを返すキャッシュは初期実装では導入しない。

### 6.8 キャッシュ

初期実装ではWorker KVを利用しない。

HTTPキャッシュを利用する場合は、プロフィールの更新頻度とプライバシー変更を考慮し、長時間のキャッシュは避ける。
特に公開から非公開へ変更した後もOGPが長期間残る設計にしない。

最初は `Cache-Control: no-store` または短いTTLから開始し、Workers/API負荷を観測してから調整する。

SNS側が独自にOGPをキャッシュする点はChuniSupport側では完全に制御できない。

### 6.9 OGP画像

初期実装ではChuniSupport共通画像を利用する。

ユーザー固有のOGP画像を生成する場合は、Worker内で画像描画を行わない。
Worker Free のCPU時間を消費するため、必要になった段階でAPI側の画像生成または既存の画像生成機能との統合を検討する。

### 6.10 Workers Free 枠

`share.chunisupport.net` のみをWorker Custom Domainとするため、通常の `chunisupport.net` 閲覧はWorker実行回数に含まれない。

共有URLについては次のアクセスが実行回数に含まれる。

- SNSクローラーによるOGP取得
- 共有URLを人間が直接開いた場合
- 外部サービスによるURL検査

Workers Free の日次上限はChuniSupportの別Workerとも共有されるため、不要な自動アクセスを生じさせない。

## 7. front側の変更予定

### 7.1 楽曲静的生成

新規候補:

```text
scripts/generate-song-ogp-pages.mjs
scripts/generate-song-ogp-pages.test.mjs または既存テスト構成に沿ったテスト
```

変更候補:

```text
package.json
```

既存の以下は原則変更しない。

```text
src/App.tsx
src/pages/songs/SongDetail/SongDetail.tsx
src/constants/routes.ts
```

### 7.2 ユーザー共有

変更候補:

```text
src/pages/users/UserPage/UserPage.tsx
```

必要に応じて追加:

```text
src/utils/share.ts
src/config.ts
src/env.d.ts
.env.example
```

共有URLを環境変数化する場合は、例えば次を追加する。

```text
PUBLIC_SHARE_URL=https://share.chunisupport.net
```

本番・ステージングで共有先を分ける必要があるため、URLのハードコードより環境変数を推奨する。

## 8. API側の変更予定

### 8.1 必須変更

ユーザー共有URLの最小実装だけならAPI変更は不要である。
既存の公開プロフィール・レーティングGETを利用する。

### 8.2 推奨変更

楽曲データ変更後にPages Deploy Hookを自動実行する場合のみAPIまたはデプロイ基盤に変更が必要となる。

Deploy Hook URL はリポジトリへコミットせず、サーバー側のSecretとして保持する。

### 8.3 将来候補

必要になった場合だけ以下を検討する。

- OGP専用の公開ユーザー概要API
- ユーザー固有OGP画像生成API
- 楽曲OGP画像生成API

初期実装には含めない。

## 9. セキュリティ・プライバシー

- OGPには既に公開されている情報だけを含める。
- メールアドレス、Firebase UID、内部ユーザーIDなどは含めない。
- 非公開プロフィールを共有URL経由で公開しない。
- API由来文字列はHTMLエスケープする。
- WorkerからAPIへ管理者用トークンを持たせない。
- Deploy Hook URLをfrontの公開環境変数へ入れない。
- share URLのユーザー名は `encodeURIComponent` 相当で生成し、Worker側でも厳密にルート解析する。

## 10. 段階的な実装

### Phase 1: 楽曲ページ静的OGP

1. OGPメタタグ生成関数を作る。
2. 全楽曲を取得するビルド後スクリプトを作る。
3. `dist/songs/:displayid/index.html` を生成する。
4. 共通ジャケットまたは既存ジャケットURLを `og:image` に設定する。
5. Cloudflare Pages Preview でHTMLソースを確認する。
6. Discord、X等のOGP取得結果を確認する。

### Phase 2: ユーザーページ共有URL

1. `share.chunisupport.net` 用Workerを作る。
2. 公開プロフィールAPIを利用してOGP HTMLを返す。
3. UserPageへ共有ボタンを追加する。
4. Web Share APIとクリップボードフォールバックを実装する。
5. 非公開ユーザーでは共有できないことを確認する。

### Phase 3: 楽曲更新との自動同期

1. Pages Deploy Hookを作成する。
2. 楽曲変更検出時だけHookを呼ぶ。
3. 連続変更時の多重デプロイを防ぐ。
4. 新曲反映からOGP生成までの遅延を確認する。

### Phase 4: 必要に応じて専用OGP画像

初期運用で必要性が確認できた場合だけ実装する。

## 11. 受け入れ条件

### 楽曲ページ

- `/songs/:displayid` を直接共有すると曲固有のタイトルと画像がOGPに表示される。
- 通常ブラウザで開いた画面は実装前と同じSolid.jsの楽曲詳細画面である。
- 楽曲詳細のルーティングやAPI取得方式を変更しない。
- JavaScript/CSS等の静的アセットは引き続きCloudflare Pagesから配信する。
- OGP生成失敗を検知できる。
- 新しいPagesデプロイで全楽曲のHTMLを最新データから再生成する。

### ユーザーページ

- 通常URL `/users/:username` は変更しない。
- 共有操作では `share.chunisupport.net/users/:username` を共有する。
- 共有URLから公開プロフィールのOGPを取得できる。
- 共有URLを人間が開くと通常ユーザーページへ移動できる。
- 非公開情報はOGPに含まれない。
- 通常のChuniSupport閲覧ではこのWorkerを実行しない。

## 12. 対象外

- ChuniSupport全ページのサーバーサイドレンダリング化。
- `chunisupport.net/*` 全体へのWorker Route導入。
- Cloudflare PagesからVPSへの静的配信移行。
- Workers Paidを前提とする設計。
- 非公開プロフィール用の一時共有トークン。
- 初期段階でのユーザー固有画像生成。
- 楽曲詳細画面そのものの静的レンダリング。

## 13. 推奨構成まとめ

```text
楽曲
  通常URLをそのまま共有
  ↓
Cloudflare Pages
  ↓
ビルド時に生成した楽曲別 index.html
  ↓
OGP取得 + 従来SPA起動

ユーザー
  UserPageの共有操作
  ↓
share.chunisupport.net/users/:username
  ↓
Cloudflare Worker
  ↓
公開プロフィールAPI
  ↓
OGP HTML
  ↓
通常の /users/:username へ遷移
```

この構成では、Cloudflare Pagesによる通常配信を維持し、Workers Free枠の消費を共有URLに限定できる。楽曲は通常URLの貼り付けだけでOGPが機能し、ユーザー共有には共有URLを使う意味も明確になる。
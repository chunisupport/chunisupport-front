# 現行バージョンに対する記法調査（chunisupport-front）

調査日: 2026-11-04。
調査対象コミット: `f7962545abb84b727a8d9144425016d2e428a881`。

このレポートは上記コミットのソース・設定と、調査環境にインストール済みの依存関係を基準にした静的調査の記録です。レポートを追加するブランチ先端の再調査結果ではありません。行番号は調査対象コミット基準です。コードの修正は行っていません。

## 対象バージョン

Solid.js 1.9.15、Router 0.16.1、TanStack Solid Query 5.102.8、Tailwind CSS 4.3.1、TypeScript 6.0.3、Rsbuild 2.1.1。`.node-version` は24.22.1。調査コマンドを実行した Node.js は24.19.0。

## 優先して更新したい箇所

### TanStack Query の非推奨メソッド

- `src/stores/friendRequestNotification.ts:124`
- 現状: `queryClient.fetchQuery({ ...options, staleTime: 0 })`
- 更新候補: `queryClient.query({ ...options, staleTime: 0 })`
- 使用中の `@tanstack/query-core` 5.102.8 の `src/queryClient.ts:390` に、次のメジャーバージョンで削除予定であることと代替メソッドが明記されている。
- `query()` は `select` も適用するため、今後オプションを追加する場合は戻り値の扱いも確認する。現在渡しているオプションに `select` はない。

### ブラウザーの非推奨 API・属性

- `src/components/XTimeline/XTimeline.tsx:55`: `script.charset = 'utf-8'`。使用中の TypeScript の DOM 型で非推奨。外部スクリプトの文字コード指定が必要か確認し、不要なら削除する。
- `src/pages/register-score-temp/RegisterScoreTempPage.tsx:193`: `document.execCommand('copy')`。DOM 型で非推奨。すでに Clipboard API を優先しており、これは旧環境向けフォールバックなので、必要な対応環境を確認して扱う。単純に削除するとフォールバックがなくなる。

## 現在も動作するが、現行の記法への更新候補

### Tailwind CSS 4 の旧名クラス: 10か所

`bg-gradient-to-br` → `bg-linear-to-br` が3か所:

- `src/components/PlayerDataEmptyState/PlayerDataEmptyState.tsx:42`
- `src/components/LoginRequiredState/LoginRequiredState.tsx:13`
- `src/components/LandingProfileCard/LandingProfileCard.tsx:69`

`break-words` → `wrap-break-word` が7か所:

- `src/pages/maintenance/MaintenancePage.tsx:47`
- `src/components/common/profile/UserNameplate.tsx:361`
- `src/components/common/LockedSongsOpComparison.tsx:195` と206行
- `src/pages/admin/AdminMaintenancePage.tsx:441`
- `src/pages/admin/AdminBatchJob.tsx:166`
- `src/components/common/AppToast.tsx:79`

インストール済みの Tailwind CSS 4.3.1 で新旧のクラスから CSS が生成されることを確認した。`break-words` と `wrap-break-word` は同じ宣言になる。グラデーションは新名側に `@supports` による補間色空間のフォールバックがあり、生成結果は完全には同一ではない。変更時は見た目を確認する。

## 確認結果と限界

- `tsc --noEmit --pretty false` は成功した。
- Router の旧 `data` / `rootData`、TanStack Query の旧 `cacheTime` / `keepPreviousData` 等の代表的な移行漏れは検出していない。
- 非推奨タグはインストール済みライブラリの型定義・実装で確認した。`createElement` / `querySelector` 等は非推奨オーバーロードのタグまで拾われるため、それだけでは指摘していない。
- ブラウザーの実機動作、全ビルド、全テスト、依存パッケージ全件の外部リリースノート照合は実施していない。

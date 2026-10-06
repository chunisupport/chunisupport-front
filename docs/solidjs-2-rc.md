# SolidJS 2.0 RC 検証メモ

このブランチは依存更新の検証用であり、実行可能な移行完了版ではありません。現状は型検査・ビルド・単体テストが失敗し、既存の画面・操作の動作維持は未確認です。マージ可能と判断するには、以下の未対応箇所の修正と動作確認が必要です。

## 更新内容

プレリリースの変更を意図せず取り込まないよう、更新対象を完全なバージョン番号で固定しています。

| パッケージ | 検証バージョン | 目的 |
| --- | --- | --- |
| `solid-js` | `2.0.0-rc.13` | Solid 2 のリアクティブランタイム |
| `@solidjs/web` | `2.0.0-rc.13` | Solid 2 で分離された DOM ランタイム |
| `@solidjs/babel-plugin` | `2.0.0-rc.13` | Solid 2 用 JSX コンパイラー |
| `@solidjs/router` | `2.0.0-next.35` | RC13 を peerDependencies に指定するルーター |
| `@tanstack/solid-query` | `6.0.0-rc.5` | RC13 をサポートする Query アダプター |
| `@kobalte/core` | `2.0.0-alpha.2` | Solid 2 向けの公開 alpha。RC13 との互換性は未確認 |

`@rsbuild/plugin-solid` は Solid 1 用の `babel-preset-solid` に依存するため削除し、既存の `@rsbuild/plugin-babel` から Solid 2 のコンパイラーを呼び出します。TypeScript の `jsxImportSource` も `@solidjs/web` に変更しています。

## 未対応箇所

### アプリケーションの API 移行

- `solid-js/web` は `@solidjs/web` へ、`solid-js/store` は `solid-js` へ移行が必要です。エントリーポイントの `render`、認証・稼働状態のストアなどに旧 import が残っています。
- `JSX` など DOM の型は `@solidjs/web` へ移動しました。既存の型 import を更新する必要があります。
- `createResource` が削除されました。非同期 computation と `Loading` 等へ移行し、既存の `loading`・`error`・`state`・`refetch`・`mutate` の挙動を検討する必要があります。
- `createEffect` は compute と apply の二段階になり、既存の一引数形式を修正する必要があります。`on`・`onMount`・`batch`・`createComputed` も旧 API のまま使えません。
- `ErrorBoundary`・`Suspense`・`Index`・`mergeProps`・`splitProps`、ストア setter、`classList`、`use:` ディレクティブなどの移行が必要です。
- setter 後の読み取りはマイクロタスクの flush 後に値が変わります。機械的な API 名の置換だけでは、既存の同期読み取りや後続処理の挙動を維持できません。
- Router 2 では既存の `Router`・`Route`・`A`・`Navigate` が export されません。`src/App.tsx` のルート定義と各画面のリンク・遷移処理の移行が必要です。
- Query 6 の API と既存 Query 利用箇所の整合確認が必要です。UI ライブラリの alpha 版についてもコンポーネント API・操作の再検証が必要です。

### 依存ライブラリ

下記の peer 不整合は解決していません。許容設定や旧ランタイムへの alias で警告を隠す対応は入れていません。

| パッケージ | 現在の peer 指定 | 影響 |
| --- | --- | --- |
| `@thisbeyond/solid-dnd@0.7.5` | `solid-js: ^1.5` | 旧 DOM・store API を使用。目標リストやグループの並べ替え |
| `@tanstack/solid-virtual@3.13.30` | `solid-js: ^1.3.0` | 旧 store・`onMount`・`createComputed` を使用。仮想テーブル |
| `lucide-solid@1.21.0` | `solid-js: ^1.4.7` | コンパイル済みコードが旧 DOM ランタイムを使用。アプリ全体のアイコン |
| `@kobalte/core@2.0.0-alpha.2` | Solid / Web `2.0.0-rc.3` | RC13 と完全一致しない。ダイアログ、入力、選択など共通 UI |
| `@kobalte/utils@2.0.0-alpha.0` | Solid / Web `2.0.0-rc.0` | Kobalte の間接依存にも RC バージョン不整合 |

調査時点で dnd・virtual・Lucide の公開 dist-tag に Solid 2 対応版はありません。対応リリース、またはアダプター・ライブラリ自体の移行が必要です。

## 検証

Node.js 24.19.0 / pnpm 11.19.0 で検証しました。CI は既存の検査を維持しています。

| コマンド | 結果 |
| --- | --- |
| `pnpm install --frozen-lockfile` | 成功 |
| `pnpm check:ci` | 成功 |
| `pnpm licenses:generate` / `pnpm licenses:check` | 成功。ルートと `public/` の通知ファイルを更新 |
| `pnpm typecheck` | 失敗。539 件の診断。旧 Solid / Router API、JSX 型、effect 引数など |
| `pnpm test:unit` | 失敗。1,431 件中 1,297 件成功、134 件失敗。旧 store サブパスの import エラーなど |
| `pnpm build` | 失敗。`createResource`・`ErrorBoundary`・`Router`・`Route` など旧 export の参照 |
| `pnpm peers check` | Solid 1 前提の依存と Kobalte の RC バージョン不整合を報告 |

ライセンス通知ファイルは依存更新後に再生成しています。開発サーバーは起動していません。ブラウザーでの動作確認はビルドが成立するまで実施できていません。

再現時は `pnpm install --frozen-lockfile` の後に上記コマンドを個別に実行してください。`pnpm verify` は失敗した段階で終了するため、全検査の結果を得るには個別実行が必要です。

## 一次資料

- [Solid 2.0 公式移行ガイド](https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/MIGRATION.md)
- [Solid 2 Babel コンパイラー](https://github.com/solidjs/solid/tree/next/packages/babel-plugin)
- [Solid Router](https://github.com/solidjs/solid-router)
- [TanStack Query](https://github.com/TanStack/query)
- [Solid DnD の依存定義](https://github.com/thisbeyond/solid-dnd/blob/main/package.json)
- [Solid Virtual の依存定義](https://github.com/TanStack/virtual/blob/main/packages/solid-virtual/package.json)
- [Lucide Solid の依存定義](https://github.com/lucide-icons/lucide/blob/main/packages/lucide-solid/package.json)
